import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { generateOrderedPayrollCsv, generateGenericCsv } from "@/lib/documents/export";

/**
 * POST /api/documents/bulk/export/csv
 * Export multiple documents as a combined CSV download.
 * Body: { documentIds: string[] }
 *
 * For payslip/p45 documents, extracts structured payroll fields.
 * For other types, exports flattened key-value pairs.
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

    // Filter to tenant's own docs
    const tenantDocs = docs.filter((doc) => doc.tenantId === tenantId);

    if (tenantDocs.length === 0) {
      return NextResponse.json({ error: "No documents found" }, { status: 404 });
    }

    // Build CSV rows with a document info header per doc
    const rows: string[] = [];

    for (const doc of tenantDocs) {
      const outputData = doc.outputData as Record<string, unknown> | null;
      if (!outputData) continue;

      const inputData = doc.inputData as Record<string, unknown> | undefined;

      // Document separator comment
      rows.push(`# Document: ${doc.title} (${doc.type}, v${doc.version})`);

      if (doc.type === "payslip" || doc.type === "p45") {
        const { csv } = generateOrderedPayrollCsv(doc.title, doc.type, outputData, inputData);
        // csv already has header + row, skip the header after first doc
        if (rows.length > 1) {
          const lines = csv.split("\n");
          // skip header line
          rows.push(lines.slice(1).join("\n"));
        } else {
          rows.push(csv);
        }
      } else {
        const { csv } = generateGenericCsv(doc.title, doc.type, outputData);
        rows.push(csv);
      }

      rows.push(""); // blank line between documents
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="docu-hive-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Bulk CSV export failed";
    console.error("Bulk CSV export error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}