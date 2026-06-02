import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantMembers, pendingInvitations } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * GET /api/tenants/members
 * Returns current team members and pending invitations for the tenant.
 */
export async function GET() {
  try {
    const { tenantId, clerkUserId } = await requireAuth();

    // Check current user's role
    const currentUser = await db
      .select({ role: tenantMembers.role })
      .from(tenantMembers)
      .where(
        and(
          eq(tenantMembers.tenantId, tenantId),
          eq(tenantMembers.clerkUserId, clerkUserId)
        )
      )
      .limit(1);

    const canManage = currentUser.length > 0 && 
      (currentUser[0].role === "owner" || currentUser[0].role === "admin");

    // Get current members
    const members = await db
      .select({
        id: tenantMembers.id,
        clerkUserId: tenantMembers.clerkUserId,
        role: tenantMembers.role,
        createdAt: tenantMembers.createdAt,
      })
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, tenantId))
      .orderBy(desc(tenantMembers.createdAt));

    // Get pending invitations
    const invitations = await db
      .select({
        id: pendingInvitations.id,
        email: pendingInvitations.email,
        status: pendingInvitations.status,
        invitedBy: pendingInvitations.invitedBy,
        createdAt: pendingInvitations.createdAt,
      })
      .from(pendingInvitations)
      .where(
        and(
          eq(pendingInvitations.tenantId, tenantId),
          eq(pendingInvitations.status, "pending")
        )
      )
      .orderBy(desc(pendingInvitations.createdAt));

    return NextResponse.json({
      members,
      invitations,
      myRole: currentUser.length > 0 ? currentUser[0].role : "member",
      canManage,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to load members";
    console.error("[tenants/members]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/tenants/members/invite
 * Invites a new member by email address.
 * Body: { email: string }
 * Only owner/admin can invite.
 */
export async function POST(request: Request) {
  try {
    const { tenantId, clerkUserId } = await requireAuth();

    // Verify inviter is owner or admin
    const currentUser = await db
      .select({ role: tenantMembers.role })
      .from(tenantMembers)
      .where(
        and(
          eq(tenantMembers.tenantId, tenantId),
          eq(tenantMembers.clerkUserId, clerkUserId)
        )
      )
      .limit(1);

    if (
      currentUser.length === 0 ||
      (currentUser[0].role !== "owner" && currentUser[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only owners and admins can invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check for existing pending invitation
    const existingInvite = await db
      .select()
      .from(pendingInvitations)
      .where(
        and(
          eq(pendingInvitations.tenantId, tenantId),
          eq(pendingInvitations.email, trimmedEmail),
          eq(pendingInvitations.status, "pending")
        )
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Send via Clerk's invitation API
    const clerk = clerkClient();
    let clerkInvitationId: string | null = null;

    try {
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: trimmedEmail,
        notify: true,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
      });
      clerkInvitationId = invitation.id;
    } catch (clerkError) {
      console.error("[tenants/members/invite] Clerk API error:", clerkError);
      // Fall back to a local-only invite if Clerk API fails
    }

    // Store locally
    const [stored] = await db
      .insert(pendingInvitations)
      .values({
        tenantId,
        email: trimmedEmail,
        clerkInvitationId,
        invitedBy: clerkUserId,
        status: "pending",
      })
      .returning({
        id: pendingInvitations.id,
        email: pendingInvitations.email,
        status: pendingInvitations.status,
        createdAt: pendingInvitations.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        invitation: stored,
        clerkInviteSent: !!clerkInvitationId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to send invite";
    console.error("[tenants/members/invite]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
