import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, emailTracking } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { sendEmail, buildDocumentEmailHtml } from "@/lib/email/send";

/**
 * POST /api/documents/[id]/send-email
 * Sends a document share link to a recipient via email.
 * Creates a share link if one doesn't exist, tracks the send, and
 * includes an open-tracking pixel.
 *
 * Body: { email: string }
 * Response: { success: true, trackingId: string, shareUrl: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, clerkUserId } = await requireAuth();

    const body = await request.json().catch(() => ({}));
    const recipientEmail: string | undefined = body.email;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid recipient email is required" },
        { status: 400 }
      );
    }

    // Verify document ownership
    const docResult = await db
      .select({
        tenantId: documents.tenantId,
        title: documents.title,
        type: documents.type,
        shareToken: documents.shareToken,
      })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!docResult.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (docResult[0].tenantId !== tenantId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docResult[0];

    // Generate share token if one doesn't exist
    let shareToken = doc.shareToken;
    if (!shareToken) {
      shareToken = crypto.randomUUID();
      const existingShared = (await db
        .select({ sharedWith: documents.sharedWith })
        .from(documents)
        .where(eq(documents.id, params.id))
        .limit(1)) as { sharedWith: string[] | null }[];

      const sharedWith = existingShared[0]?.sharedWith || [];
      await db
        .update(documents)
        .set({
          shareToken,
          sharedWith: [...sharedWith, recipientEmail],
          updatedAt: new Date(),
        })
        .where(eq(documents.id, params.id));
    } else {
      // Ensure recipient is tracked
      const current = (await db
        .select({ sharedWith: documents.sharedWith })
        .from(documents)
        .where(eq(documents.id, params.id))
        .limit(1)) as { sharedWith: string[] | null }[];

      const existing = current[0]?.sharedWith || [];
      if (!existing.includes(recipientEmail)) {
        await db
          .update(documents)
          .set({
            sharedWith: [...existing, recipientEmail],
            updatedAt: new Date(),
          })
          .where(eq(documents.id, params.id));
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://docuhive.vercel.app";
    const shareUrl = `${appUrl}/documents/shared/${shareToken}`;

    // Create tracking record
    const [tracking] = await db
      .insert(emailTracking)
      .values({
        tenantId,
        documentId: params.id,
        recipientEmail,
        senderName: clerkUserId,
        shareToken,
        status: "sent",
      })
      .returning({ id: emailTracking.id });

    // Build open tracking pixel URL
    const openTrackingUrl = `${appUrl}/api/email/track/${tracking.id}/open`;

    // Send the email
    const senderName = clerkUserId.slice(0, 8);
    const emailHtml = buildDocumentEmailHtml({
      senderName: `User ${senderName}`,
      documentTitle: doc.title,
      documentType: doc.type,
      shareUrl,
    });

    // Fire and forget — don't block on email delivery failure
    sendEmail({
      to: recipientEmail,
      subject: `📄 ${doc.title} has been shared with you`,
      html: emailHtml,
      openTrackingUrl,
    }).catch((err) => console.error("[send-email] Email send failed:", err));

    return NextResponse.json({
      success: true,
      trackingId: tracking.id,
      shareUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}