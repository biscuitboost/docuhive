import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/documents/:id/versions
 * List all versions for a document with metadata (no full content).
 * Tenant-scoped + auth enforced.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    // Verify document ownership
    const doc = await db
      .select({ tenantId: documents.tenantId, currentIssuedVersion: documents.currentIssuedVersion })
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

    const versions = await db
      .select({
        version: documentVersions.version,
        changeType: documentVersions.changeType,
        changeDescription: documentVersions.changeDescription,
        changedBy: documentVersions.changedBy,
        createdAt: documentVersions.createdAt,
      })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, params.id))
      .orderBy(desc(documentVersions.version));

    // Add isIssued flag to each version
    const issuedVersion = doc.currentIssuedVersion;
    const result = versions.map((v) => ({
      ...v,
      isIssued: v.version === issuedVersion,
    }));

    return NextResponse.json({
      versions: result,
      totalCount: result.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to list versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}