import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import stripe from '@/lib/stripe/client';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/stripe/portal
 * Redirect to Stripe Customer Portal for subscription management.
 * Tenant-scoped — resolves the customerId from the authenticated tenant.
 */
export async function GET(_request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    // Look up the tenant's Stripe customer ID
    const tenant = await db
      .select({ stripeCustomerId: tenants.stripeCustomerId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)
      .then((r) => r[0]);

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found for this tenant. Subscribe first.' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://docuhive.vercel.app'}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Portal redirect failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
