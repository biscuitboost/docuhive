/**
 * Tenant resolution and auth helpers.
 * Validates Clerk sessions and resolves the tenant ID for API routes.
 */
import { db } from "@/lib/db";
import { tenants, tenantMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Resolves the tenant ID for a Clerk user.
 * If the user doesn't have a tenant yet, creates one.
 * Checks for pending invitations first — if the user's email was invited,
 * they join the inviting tenant instead of creating a new one.
 * Call this from API routes that need a tenant context.
 */
export async function resolveTenant(clerkUserId: string, userName?: string): Promise<string> {
  // Check if user already belongs to a tenant
  const membership = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.clerkUserId, clerkUserId))
    .limit(1);

  if (membership.length > 0) {
    return membership[0].tenantId;
  }

  // Check for pending invitations — user was invited to join an existing tenant
  // Fetch user's email from Clerk API to match against pending invitations
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = clerkClient();
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    if (userEmail) {
      const { pendingInvitations } = await import("@/lib/db/schema");
      const { and } = await import("drizzle-orm");

      const invite = await db
        .select()
        .from(pendingInvitations)
        .where(
          and(
            eq(pendingInvitations.email, userEmail),
            eq(pendingInvitations.status, "pending")
          )
        )
        .limit(1);

      if (invite.length > 0) {
        const invitation = invite[0];

        // Add user as member to the inviting tenant
        await db.insert(tenantMembers).values({
          tenantId: invitation.tenantId,
          clerkUserId,
          role: "member",
        });

        // Mark invitation as accepted
        await db
          .update(pendingInvitations)
          .set({ status: "accepted" })
          .where(eq(pendingInvitations.id, invitation.id));

        return invitation.tenantId;
      }
    }
  } catch {
    // Clerk API call failed — fall through to auto-provision
    console.warn("[resolveTenant] Could not check pending invitations");
  }

  // Auto-provision a new tenant
  const displayName = userName || `User ${clerkUserId.slice(0, 8)}`;
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: `${displayName}'s Company`,
      plan: "essentials",
    })
    .returning({ id: tenants.id });

  // Add user as owner
  await db.insert(tenantMembers).values({
    tenantId: tenant.id,
    clerkUserId,
    role: "owner",
  });

  return tenant.id;
}

/**
 * Validates a Clerk session from request headers.
 * Returns { clerkUserId, tenantId } or null if unauthenticated.
 * Uses the in-request auth header pattern that Clerk's middleware provides.
 */
import { auth } from "@clerk/nextjs/server";

export interface AuthResult {
  clerkUserId: string;
  tenantId: string;
}

export async function requireAuth(): Promise<AuthResult> {
  const session = auth();
  const clerkUserId = session.userId;

  if (!clerkUserId) {
    throw new AuthError("Unauthorized — no valid session");
  }

  const tenantId = await resolveTenant(clerkUserId);
  return { clerkUserId, tenantId };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Wraps an API handler with Clerk auth.
 * Returns 401 immediately if no valid session.
 */
export function withAuth<T>(
  handler: (_auth: AuthResult, _req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request) => {
    try {
      const authResult = await requireAuth();
      return handler(authResult, req);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }
  };
}
