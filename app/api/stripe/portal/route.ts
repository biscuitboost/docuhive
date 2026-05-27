import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe/client';

/**
 * GET /api/stripe/portal?customerId=xxx
 * Redirect to Stripe Customer Portal for subscription management.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.headers.get('origin')}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Portal redirect failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
