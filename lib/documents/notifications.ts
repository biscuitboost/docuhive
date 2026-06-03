/**
 * Notifications helper functions.
 * Insert and query notifications for tenants.
 */
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export type NotificationType =
  | "document_generated"
  | "document_edited"
  | "document_regenerated"
  | "document_archived"
  | "document_restored"
  | "version_issued"
  | "payment_success"
  | "payment_failed"
  | "plan_changed"
  | "team_invite";

/**
 * Create a new notification for a tenant.
 */
export async function createNotification(
  tenantId: string,
  type: NotificationType,
  title: string,
  message?: string,
  link?: string,
) {
  const [notification] = await db
    .insert(notifications)
    .values({
      tenantId,
      type: type as any,
      title,
      message: message ?? null,
      link: link ?? null,
    })
    .returning();
  return notification;
}

/**
 * Get the unread notification count for a tenant.
 */
export async function getUnreadCount(tenantId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.tenantId, tenantId), eq(notifications.read, false))
    )
    .limit(1);
  return Number(result[0]?.count || 0);
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a tenant.
 */
export async function markAllAsRead(tenantId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.tenantId, tenantId), eq(notifications.read, false)));
}

/**
 * List recent notifications for a tenant (newest first, limit 50).
 */
export async function listNotifications(tenantId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.tenantId, tenantId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}