import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { getUnreadCount } from "@/lib/documents/notifications";

/**
 * GET /api/notifications/count
 * Returns the unread notification count for the authenticated tenant.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();
    const count = await getUnreadCount(tenantId);
    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to get notification count";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}