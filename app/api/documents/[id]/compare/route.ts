import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentVersions, documents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { computeDiff } from "@/lib/documents/diff";

/**
 * GET /api/documents/:id/compare?v1=<version>&v2=<version>
 * Side-by-side comparison of two document versions with diff highlighting.
 *
 * Returns:
 *   - v1: full snapshot of the first version
 *   - v2: full snapshot of the second version
 *   - diff: computed section-level and word-level diff
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const { searchParams } = new URL(_request.url);
    const v1Str = searchParams.get("v1");
    const v2Str = searchParams.get("v2");

    if (!v1Str || !v2Str) {
      return NextResponse.json(
        { error: "Both v1 and v2 query parameters are required" },
        { status: 400 }
      );
    }

    const v1Num = parseInt(v1Str, 10);
    const v2Num = parseInt(v2Str, 10);

    if (isNaN(v1Num) || isNaN(v2Num) || v1Num < 1 || v2Num < 1) {
      return NextResponse.json(
        { error: "Invalid version numbers" },
        { status: 400 }
      );
    }

    if (v1Num === v2Num) {
      return NextResponse.json(
        { error: "Cannot compare a version with itself" },
        { status: 400 }
      );
    }

    // Verify document ownership
    const doc = await db
      .select({ tenantId: documents.tenantId })
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

    // Fetch both versions
    const [v1, v2] = await Promise.all([
      db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, params.id),
            eq(documentVersions.version, v1Num)
          )
        )
        .limit(1)
        .then((r) => r[0]),
      db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, params.id),
            eq(documentVersions.version, v2Num)
          )
        )
        .limit(1)
        .then((r) => r[0]),
    ]);

    if (!v1) {
      return NextResponse.json(
        { error: `Version ${v1Num} not found` },
        { status: 404 }
      );
    }
    if (!v2) {
      return NextResponse.json(
        { error: `Version ${v2Num} not found` },
        { status: 404 }
      );
    }

    const v1Output = (v1.outputData ?? {}) as Record<string, unknown>;
    const v2Output = (v2.outputData ?? {}) as Record<string, unknown>;

    const diff = computeDiff(v1Output, v2Output);

    return NextResponse.json({
      documentId: params.id,
      versions: [
        {
          version: v1.version,
          changeType: v1.changeType,
          changeDescription: v1.changeDescription,
          createdAt: v1.createdAt,
          outputData: v1Output,
        },
        {
          version: v2.version,
          changeType: v2.changeType,
          changeDescription: v2.changeDescription,
          createdAt: v2.createdAt,
          outputData: v2Output,
        },
      ],
      diff,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to compare versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}