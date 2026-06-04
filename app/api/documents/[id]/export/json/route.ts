import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { generateJsonExport } from "@/lib/documents/export";

/**
 * GET /api/documents/:id/export/json
 * Export document data as a downloadable JSON file.
 * Tenant-scoped — only the owning tenant can export.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = result[0];

    // Tenant isolation
    if (doc.tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { json, filename } = generateJsonExport(
      doc.title,
      doc.type,
      doc.status,
      doc.version,
      doc.inputData as Record<string, unknown> | null,
      doc.outputData as Record<string, unknown> | null,
      doc.aiModel,
      doc.createdAt,
      doc.updatedAt
    );

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Export failed";
    console.error("JSON export error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}