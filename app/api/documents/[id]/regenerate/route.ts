import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { getModelForDocType } from "@/lib/ai/models";
import { generateDocument as aiGenerate } from "@/lib/ai/client";
import { buildPrompt } from "@/lib/ai/prompts";
import { createVersionSnapshot } from "@/lib/documents/versions";
import { createNotification } from "@/lib/documents/notifications";

/**
 * POST /api/documents/:id/regenerate
 *
 * Regenerates a document with updated input data.
 * Creates a version snapshot before overwriting.
 * Calls the AI directly (same as initial generation) with new inputs.
 * Body: { userInputs: Record<string, string> }
 * Response: { documentId: string, version: number, content: Record<string, unknown> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, clerkUserId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const userInputs: Record<string, string> | undefined = body.userInputs;

    if (!userInputs || typeof userInputs !== "object") {
      return NextResponse.json(
        { error: "Missing required field: userInputs (object)" },
        { status: 400 }
      );
    }

    // Load the current document with tenant isolation
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = result[0];

    if (doc.tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status === "draft" || doc.status === "archived") {
      return NextResponse.json(
        { error: "Only generated documents can be regenerated" },
        { status: 400 }
      );
    }

    // Snapshot current version before overwriting
    if (doc.outputData) {
      await createVersionSnapshot({
        documentId: doc.id,
        version: doc.version,
        outputData: doc.outputData as Record<string, unknown>,
        inputData: doc.inputData as Record<string, unknown> | undefined,
        changeType: "regenerate",
        changeDescription: "Document regenerated with updated inputs",
        changedBy: clerkUserId,
      });
    }

    // Call AI directly (same path as initial generation)
    const model = doc.aiModel ?? getModelForDocType(doc.type as any);
    const promptResult = buildPrompt(doc.type as any, userInputs);
    if (!promptResult) {
      return NextResponse.json(
        { error: `No template found for document type: ${doc.type}` },
        { status: 500 }
      );
    }

    const aiResult = await aiGenerate({
      templatePrompt: promptResult.prompt,
      systemPrompt: promptResult.system,
      userInputs,
      model,
    });

    const newVersion = doc.version + 1;

    // Update the existing document with new content
    await db
      .update(documents)
      .set({
        outputData: aiResult.content,
        inputData: userInputs,
        version: newVersion,
        aiModel: aiResult.model,
        status: "generated",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, doc.id));

    // Create notification
    await createNotification(
      tenantId,
      "document_regenerated",
      "Document Regenerated",
      `"${doc.title}" has been regenerated (v${newVersion}).`,
      `/documents/${doc.id}`,
    );

    return NextResponse.json({
      documentId: doc.id,
      version: newVersion,
      content: aiResult.content,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to regenerate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}