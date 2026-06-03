import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, tenants } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';
import { PLANS, type PlanId } from '@/lib/stripe/pricing';

/**
 * GET /api/billing/subscription
 * Returns the current subscription info for the authenticated tenant.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    // Get the tenant record to check plan + stripe customer
    const tenant = await db
      .select({
        plan: tenants.plan,
        stripeCustomerId: tenants.stripeCustomerId,
        stripeSubscriptionId: tenants.stripeSubscriptionId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get the latest subscription record
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const planId = (tenant[0].plan ?? 'essentials') as PlanId;
    const planConfig = PLANS[planId];

    return NextResponse.json({
      plan: planId,
      planName: planConfig.name,
      planPrice: planConfig.price,
      docsLimit: planConfig.docsLimit,
      multiUser: planConfig.multiUser,
      allowBranding: planConfig.allowBranding,
      stripeCustomerId: tenant[0].stripeCustomerId,
      stripeSubscriptionId: tenant[0].stripeSubscriptionId,
      subscription: sub.length > 0
        ? {
            status: sub[0].status,
            currentPeriodStart: sub[0].currentPeriodStart,
            currentPeriodEnd: sub[0].currentPeriodEnd,
            documentsUsed: sub[0].documentsUsed,
            stripePriceId: sub[0].stripePriceId,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to get billing info';
    console.error('[billing/subscription]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
