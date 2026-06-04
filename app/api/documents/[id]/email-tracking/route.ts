import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTracking, documents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/documents/:id/email-tracking
 * Returns email tracking data for a document (who it was sent to, opened status).
 * Tenant-scoped — only the document owner can see this.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    // Verify document ownership first
    const doc = await db
      .select({ tenantId: documents.tenantId })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!doc.length || doc[0].tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch tracking records scoped to this tenant AND document
    const records = await db
      .select({
        id: emailTracking.id,
        recipientEmail: emailTracking.recipientEmail,
        status: emailTracking.status,
        openedAt: emailTracking.openedAt,
        createdAt: emailTracking.createdAt,
      })
      .from(emailTracking)
      .where(
        and(
          eq(emailTracking.documentId, params.id),
          eq(emailTracking.tenantId, tenantId)
        )
      )
      .orderBy(emailTracking.createdAt);

    return NextResponse.json({ tracking: records });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to load tracking data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}