import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTracking } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/email/track/:id/open
 * Open tracking pixel endpoint.
 * Returns a 1x1 transparent GIF.
 * Fires and forgets status update — never blocks on DB.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Update status to "opened" if not already opened
  // Fire and forget — non-blocking
  db.update(emailTracking)
    .set({
      status: "opened",
      openedAt: new Date(),
    })
    .where(
      eq(emailTracking.id, params.id)
    )
    .catch(() => {
      // Silently fail — tracking should never break the page
    });

  // Return 1x1 transparent GIF
  const gif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(gif, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}