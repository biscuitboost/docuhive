import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renderers, PdfRenderInput } from "@/lib/documents/pdf";

/**
 * GET /api/documents/:id/download
 * Downloads a generated document as PDF.
 * Renders the PDF on-demand from stored AI output data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = result[0];
    if (!doc.outputData || !doc.inputData) {
      return NextResponse.json(
        { error: "Document has no generated content yet" },
        { status: 404 }
      );
    }

    // Find the PDF renderer for this document type
    const renderFn = renderers[doc.type as keyof typeof renderers];
    if (!renderFn) {
      return NextResponse.json(
        { error: `No PDF renderer for document type: ${doc.type}` },
        { status: 500 }
      );
    }

    // Build render input from stored data
    const inputData = doc.inputData as Record<string, string>;
    const pdfInput: PdfRenderInput = {
      title: doc.title,
      employeeName:
        inputData.employee_name || inputData.candidate_name || "",
      jobTitle: inputData.job_title || "",
      startDate: inputData.start_date || "",
      sections: doc.outputData as Record<string, string>,
    };

    const pdfBuffer = await renderFn(pdfInput);
    const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    // Node.js Buffer type doesn't perfectly match Web BodyInit — safe cast
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    console.error("Download error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
