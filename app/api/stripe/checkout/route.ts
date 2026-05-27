import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/client';
import { PLANS } from '@/lib/stripe/pricing';

/**
 * GET /api/stripe/checkout?plan=essentials&tenantId=xxx
 * Create a Stripe checkout session.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan') || 'essentials';
    const tenantId = searchParams.get('tenantId');
    // TODO: Validate tenant access via Clerk session

    const priceId = PLANS[plan as keyof typeof PLANS]?.stripePriceId;
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tenantId },
      success_url: `${request.headers.get('origin')}/settings/billing?success=true`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
