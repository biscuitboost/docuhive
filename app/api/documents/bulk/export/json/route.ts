import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * POST /api/documents/bulk/export/json
 * Export multiple documents as a JSON array download.
 * Body: { documentIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    const body = (await request.json()) as { documentIds?: string[] };
    const documentIds = body.documentIds ?? [];

    if (documentIds.length === 0) {
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 });
    }

    const docs = await db
      .select()
      .from(documents)
      .where(inArray(documents.id, documentIds));

    // Filter to tenant's own docs and build export objects
    const exportData = docs
      .filter((doc) => doc.tenantId === tenantId)
      .map((doc) => ({
        title: doc.title,
        type: doc.type,
        status: doc.status,
        version: doc.version,
        generatedAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        model: doc.aiModel,
        inputData: doc.inputData,
        outputData: doc.outputData,
      }));

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="docu-hive-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Bulk export failed";
    console.error("Bulk JSON export error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}