import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/documents/generate";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { documents, subscriptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getPlan } from "@/lib/stripe/pricing";

/**
 * POST /api/documents/generate
 * Generate a new document with auth + plan limit checks.
 */
export async function POST(request: NextRequest) {
  try {
    const { clerkUserId, tenantId } = await requireAuth();
    const body = await request.json();

    // Resolve the tenant from session — override any client-sent tenantId
    body.tenantId = tenantId;
    body.createdBy = clerkUserId;

    // Check plan limits
    const planLimit = await getPlanLimit(tenantId);
    if (planLimit !== null) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          sql`${documents.tenantId} = ${tenantId} AND ${documents.createdAt} >= ${monthStart.toISOString()}`
        )
        .limit(1);

      const docsUsed = Number(countResult[0]?.count || 0);
      if (docsUsed >= planLimit) {
        return NextResponse.json(
          { error: "Monthly document limit reached. Upgrade your plan." },
          { status: 403 }
        );
      }
    }

    const result = await generateDocument(body);

    // Atomically increment documents_used on subscription
    await db
      .update(subscriptions)
      .set({ documentsUsed: sql`${subscriptions.documentsUsed} + 1` })
      .where(eq(subscriptions.tenantId, tenantId));

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getPlanLimit(tenantId: string): Promise<number | null> {
  try {
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1)
      .then((r) => r[0]);

    if (!sub) return null; // No subscription = no limit enforcement
    const plan = getPlan(sub.plan);
    return plan?.docsLimit ?? null;
  } catch {
    return null;
  }
}
