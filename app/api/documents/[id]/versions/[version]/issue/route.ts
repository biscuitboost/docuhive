import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * POST /api/documents/:id/versions/:version/issue
 * Mark a specific version as the "issued" version — the one sent to the other party.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const { tenantId } = await requireAuth();
    const versionNum = parseInt(params.version, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      return NextResponse.json({ error: "Invalid version number" }, { status: 400 });
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

    // Verify the version exists
    const version = await db
      .select({ id: documentVersions.id })
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, params.id),
          eq(documentVersions.version, versionNum)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Mark as issued
    await db
      .update(documents)
      .set({
        currentIssuedVersion: versionNum,
        status: "issued",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    return NextResponse.json({
      documentId: doc.id,
      issuedVersion: versionNum,
      issuedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to mark version as issued";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}