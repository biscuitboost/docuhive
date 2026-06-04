import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { generateOrderedPayrollCsv, generateGenericCsv } from "@/lib/documents/export";

/**
 * GET /api/documents/:id/export/csv
 * Export document data as a downloadable CSV file.
 * For payslip/p45 documents, extracts structured payroll fields.
 * For other document types, exports flattened key-value pairs.
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

    if (!doc.outputData) {
      return NextResponse.json(
        { error: "Document has no generated content to export" },
        { status: 400 }
      );
    }

    const outputData = doc.outputData as Record<string, unknown>;
    const inputData = doc.inputData as Record<string, unknown> | undefined;

    let csv: string;
    let filename: string;

    if (doc.type === "payslip") {
      const result = generateOrderedPayrollCsv(doc.title, "payslip", outputData, inputData);
      csv = result.csv;
      filename = result.filename;
    } else if (doc.type === "p45") {
      const result = generateOrderedPayrollCsv(doc.title, "p45", outputData, inputData);
      csv = result.csv;
      filename = result.filename;
    } else {
      const result = generateGenericCsv(doc.title, doc.type, outputData);
      csv = result.csv;
      filename = result.filename;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Export failed";
    console.error("CSV export error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}