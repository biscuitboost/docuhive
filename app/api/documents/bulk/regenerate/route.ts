import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { getModelForDocType } from "@/lib/ai/models";
import { generateDocument as aiGenerate } from "@/lib/ai/client";
import { buildPrompt } from "@/lib/ai/prompts";
import { createVersionSnapshot } from "@/lib/documents/versions";
import { createNotification } from "@/lib/documents/notifications";

/**
 * POST /api/documents/bulk/regenerate
 *
 * Regenerates multiple documents at once.
 * Body: { documentIds: string[] }
 * Response: { regenerated: number, errors: { id: string, title: string, error: string }[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, clerkUserId } = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const documentIds: string[] = body.documentIds as string[];

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "documentIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (documentIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 documents per bulk operation" },
        { status: 400 }
      );
    }

    // Load documents with tenant isolation
    const docs = await db
      .select()
      .from(documents)
      .where(inArray(documents.id, documentIds));

    const ownedDocs = docs.filter((d) => d.tenantId === tenantId);

    if (ownedDocs.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    const errors: { id: string; title: string; error: string }[] = [];
    let regeneratedCount = 0;

    for (const doc of ownedDocs) {
      try {
        if (doc.status === "draft" || doc.status === "archived") {
          errors.push({
            id: doc.id,
            title: doc.title,
            error: "Draft or archived documents cannot be regenerated",
          });
          continue;
        }

        if (!doc.inputData) {
          errors.push({
            id: doc.id,
            title: doc.title,
            error: "No input data available for regeneration",
          });
          continue;
        }

        const userInputs = doc.inputData as Record<string, string>;

        // Snapshot current version before overwriting
        if (doc.outputData) {
          await createVersionSnapshot({
            documentId: doc.id,
            version: doc.version,
            outputData: doc.outputData as Record<string, unknown>,
            inputData: doc.inputData as Record<string, unknown> | undefined,
            changeType: "regenerate",
            changeDescription: "Bulk regeneration",
            changedBy: clerkUserId,
          });
        }

        // Regenerate with the same inputs
        const model = doc.aiModel ?? getModelForDocType(doc.type as any);
        const promptResult = buildPrompt(doc.type as any, userInputs, doc.jurisdiction ?? undefined);
        if (!promptResult) {
          errors.push({
            id: doc.id,
            title: doc.title,
            error: `No template found for document type: ${doc.type}`,
          });
          continue;
        }

        const aiResult = await aiGenerate({
          templatePrompt: promptResult.prompt,
          systemPrompt: promptResult.system,
          userInputs,
          model,
        });

        const newVersion = doc.version + 1;

        await db
          .update(documents)
          .set({
            outputData: aiResult.content,
            version: newVersion,
            aiModel: aiResult.model,
            status: "generated",
            updatedAt: new Date(),
          })
          .where(eq(documents.id, doc.id));

        regeneratedCount++;
      } catch (e) {
        errors.push({
          id: doc.id,
          title: doc.title,
          error: e instanceof Error ? e.message : "Regeneration failed",
        });
      }
    }

    if (regeneratedCount > 0) {
      await createNotification(
        tenantId,
        "document_regenerated",
        "Documents Regenerated",
        `${regeneratedCount} document${regeneratedCount > 1 ? "s" : ""} regenerated.`,
        "/documents"
      );
    }

    return NextResponse.json({
      regenerated: regeneratedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Bulk regenerate failed";
    console.error("Bulk regenerate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}