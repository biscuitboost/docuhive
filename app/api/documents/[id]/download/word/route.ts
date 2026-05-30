import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generators, WordRenderInput } from "@/lib/documents/word";

/**
 * GET /api/documents/:id/download/word
 * Downloads a generated document as .docx.
 * Renders the Word docx on-demand from stored AI output data.
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

    // Find the Word generator for this document type
    const genFn = generators[doc.type as keyof typeof generators];
    if (!genFn) {
      return NextResponse.json(
        { error: `No Word generator for document type: ${doc.type}` },
        { status: 500 }
      );
    }

    // Build render input from stored data
    const wordInput: WordRenderInput = {
      title: doc.title,
      sections: doc.outputData as Record<string, string>,
    };

    const docxBuffer = await genFn(wordInput);
    const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;

    return new NextResponse(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    console.error("Word download error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
