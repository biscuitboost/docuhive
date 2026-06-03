import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { createVersionSnapshot } from "@/lib/documents/versions";

/**
 * POST /api/documents/:id/versions/:version/restore
 * Restore document to a previous version. Creates a NEW version
 * with the snapshot of the target version. Does NOT delete history.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const { clerkUserId, tenantId } = await requireAuth();
    const versionNum = parseInt(params.version, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      return NextResponse.json({ error: "Invalid version number" }, { status: 400 });
    }

    // Verify document ownership and load current state
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

    // Get target version snapshot
    const targetVersion = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, params.id),
          eq(documentVersions.version, versionNum)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!targetVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Snapshot current version before restoring
    await createVersionSnapshot({
      documentId: doc.id,
      version: doc.version,
      outputData: doc.outputData as Record<string, unknown>,
      inputData: doc.inputData as Record<string, unknown> | undefined,
      changeType: "restore",
      changeDescription: `Restored from version ${versionNum}`,
      changedBy: clerkUserId,
    });

    // Restore document to target version's content
    const newVersion = doc.version + 1;
    await db
      .update(documents)
      .set({
        outputData: targetVersion.outputData,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    return NextResponse.json({
      documentId: doc.id,
      newVersion,
      content: targetVersion.outputData,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to restore version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}