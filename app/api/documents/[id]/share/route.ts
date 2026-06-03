import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * POST /api/documents/:id/share
 * Generates a share token for a document.
 * Body: { email?: string } — optional, records who the link was shared with
 * Response: { shareToken, shareUrl }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const email: string | undefined = body.email;

    // Verify ownership
    const result = await db
      .select({ tenantId: documents.tenantId, sharedWith: documents.sharedWith })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (result[0].tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const shareToken = crypto.randomUUID();
    const existingShared = (result[0].sharedWith || []) as string[];
    const newShared = email && !existingShared.includes(email)
      ? [...existingShared, email]
      : existingShared;

    await db
      .update(documents)
      .set({
        shareToken,
        sharedWith: newShared,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://docuhive.vercel.app";
    const shareUrl = `${appUrl}/documents/shared/${shareToken}`;

    return NextResponse.json({ shareToken, shareUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to share document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id/share
 * Revokes all sharing for a document (clears shareToken and sharedWith).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const result = await db
      .select({ tenantId: documents.tenantId })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (result[0].tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await db
      .update(documents)
      .set({
        shareToken: null,
        sharedWith: [],
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to revoke sharing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}