import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/documents/:id/versions/:version
 * Get the full snapshot of a specific version.
 */
export async function GET(
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

    const version = await db
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

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      version: version.version,
      outputData: version.outputData,
      inputData: version.inputData ?? null,
      changeType: version.changeType,
      changeDescription: version.changeDescription,
      changedBy: version.changedBy,
      createdAt: version.createdAt,
      isIssued: version.version === doc.currentIssuedVersion,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to get version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}