import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { createVersionSnapshot } from "@/lib/documents/versions";

/**
 * POST /api/documents/:id/sections/:sectionKey
 * Manually edit a specific section of a document.
 * Creates a new version with change_type='manual_edit'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; sectionKey: string } }
) {
  try {
    const { clerkUserId, tenantId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const content: string | undefined = body.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing required field: content (string)" },
        { status: 400 }
      );
    }

    // Verify document ownership
    const doc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1)
      .then((r) => r[0]);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (doc.tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.status === "draft" || doc.status === "archived") {
      return NextResponse.json(
        { error: "Only generated documents can be edited" },
        { status: 400 }
      );
    }

    if (!doc.outputData) {
      return NextResponse.json(
        { error: "Document has no generated content to edit" },
        { status: 400 }
      );
    }

    const currentContent = doc.outputData as Record<string, unknown>;

    // Deep-clone and replace the section
    const updatedContent = JSON.parse(JSON.stringify(currentContent));
    updatedContent[params.sectionKey] = content;

    // Snapshot current version before overwriting
    await createVersionSnapshot({
      documentId: doc.id,
      version: doc.version,
      outputData: currentContent,
      inputData: doc.inputData as Record<string, unknown> | undefined,
      changeType: "manual_edit",
      changeDescription: `Manual edit: ${params.sectionKey}`,
      changedBy: clerkUserId,
    });

    const newVersion = doc.version + 1;
    await db
      .update(documents)
      .set({
        outputData: updatedContent,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    return NextResponse.json({
      documentId: doc.id,
      version: newVersion,
      content: updatedContent,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to edit section";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}