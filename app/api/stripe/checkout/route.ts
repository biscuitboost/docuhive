import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import stripe from '@/lib/stripe/client';
import { PLANS, getPriceId, type PlanId, type BillingMode } from '@/lib/stripe/pricing';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

// ── Validation ────────────────────────────────────────────────────

const CheckoutSchema = z.object({
  plan: z
    .string()
    .refine((val): val is PlanId => val in PLANS, {
      message: `Invalid plan. Must be one of: ${Object.keys(PLANS).join(', ')}`,
    })
    .optional()
    .default('essentials'),
  billing: z
    .enum(['monthly', 'annual'])
    .optional()
    .default('monthly'),
});

// ── POST /api/stripe/checkout ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate — get the logged-in user's tenant
    const { tenantId } = await requireAuth();

    // 2. Parse and validate the request body
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? 'Invalid request body' },
        { status: 400 },
      );
    }

    const { plan, billing } = parsed.data;
    const priceId = getPriceId(plan, billing);

    if (!priceId) {
      return NextResponse.json(
        { error: `No Stripe price configured for plan "${plan}" (${billing}). Set STRIPE_PRICE_${plan.toUpperCase()}${billing === 'annual' ? '_ANNUAL' : ''} in env.` },
        { status: 500 },
      );
    }

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // 3. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tenantId, plan, billing },
      success_url: `${origin}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('[stripe/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET /api/stripe/checkout?plan=essentials ───────────────────────
//     Simple GET variant for link-based checkout (no auth needed on
//     the session itself — Stripe owns identity via the customer).
//     Kept for backwards compatibility.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planParam = (searchParams.get('plan') ?? 'essentials') as string;

    if (!(planParam in PLANS)) {
      return NextResponse.json(
        { error: `Invalid plan "${planParam}". Must be one of: ${Object.keys(PLANS).join(', ')}` },
        { status: 400 },
      );
    }

    const plan = planParam as PlanId;
    const billingParam = searchParams.get('billing') ?? 'monthly';
    const billing = billingParam === 'annual' ? 'annual' as BillingMode : 'monthly' as BillingMode;
    const priceId = getPriceId(plan, billing);

    if (!priceId) {
      return NextResponse.json(
        { error: `No Stripe price configured for plan "${plan}" (${billing}).` },
        { status: 500 },
      );
    }

    // GET can't require auth — it's a direct link. Tenant is optional.
    const tenantId = searchParams.get('tenantId') ?? undefined;

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(tenantId ? { metadata: { tenantId, plan, billing } } : { metadata: { plan, billing } }),
      success_url: `${origin}/settings/billing?success=true`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('[stripe/checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
