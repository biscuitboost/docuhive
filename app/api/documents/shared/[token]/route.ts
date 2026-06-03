import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/documents/shared/[token]
 * Public endpoint — returns document content by share token (no auth required).
 * Only returns documents that have the matching shareToken.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const result = await db
      .select({
        id: documents.id,
        title: documents.title,
        type: documents.type,
        status: documents.status,
        outputData: documents.outputData,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.shareToken, params.token))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Shared document not found or link has been revoked" }, { status: 404 });
    }

    const doc = result[0];

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      status: doc.status,
      content: doc.outputData,
      createdAt: doc.createdAt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load shared document" }, { status: 500 });
  }
}