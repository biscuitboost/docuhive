import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { listNotifications, markAsRead, markAllAsRead, getUnreadCount } from "@/lib/documents/notifications";

/**
 * GET /api/notifications
 * Returns the most recent 50 notifications for the authenticated tenant.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();
    const items = await listNotifications(tenantId, 50);
    const unread = await getUnreadCount(tenantId);
    return NextResponse.json({ items, unread });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to list notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read.
 * Body: { ids: string[] } — mark specific notifications
 * Or:    { all: true } — mark all as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json().catch(() => ({}));

    if (body.all === true) {
      await markAllAsRead(tenantId);
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      for (const id of body.ids) {
        await markAsRead(id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Provide either { ids: string[] } or { all: true }" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}