// ── Billing + Subscription Cross-Workflow Tests ─────────────────
// Tests the billing integration flow: plan pricing → checkout → portal → billing/subscription API.
// This suite spans Pricing UI, Stripe API routes, and the billing/subscription data endpoint.

jest.mock('next/server', () => {
  const createResponse = (body: any, init: ResponseInit = {}) => {
    const headers = new Headers(init.headers);
    const status = init.status ?? 200;
    return { status, headers, json: async () => body, ok: status >= 200 && status < 300 };
  };
  return {
    NextResponse: { json: (body: any, init?: ResponseInit) => createResponse(body, init) },
    NextRequest: class MockNextRequest {
      public url: string; public headers: Headers; public method: string;
      private bodyFn: (() => Promise<any>) | undefined;
      constructor(input: string, init?: RequestInit) {
        this.url = input; this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
      }
      async json() { return this.bodyFn ? this.bodyFn() : {}; }
      _setBody(fn: () => Promise<any>) { this.bodyFn = fn; }
    },
  };
});

jest.mock('@/lib/auth/tenant', () => {
  const AuthError = class AuthError extends Error {
    constructor(m: string) { super(m); this.name = 'AuthError'; }
  };
  return { __esModule: true, requireAuth: jest.fn(), AuthError };
});

jest.mock('@/lib/stripe/client', () => ({
  __esModule: true,
  default: {
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
  },
}));

jest.mock('@/lib/stripe/pricing', () => ({
  __esModule: true,
  PLANS: {
    essentials: { id: 'essentials', name: 'Essentials', price: 49, docsLimit: 10, multiUser: false, stripePriceId: 'price_essentials_test' },
    pro: { id: 'pro', name: 'Pro', price: 79, docsLimit: null, multiUser: false, stripePriceId: 'price_pro_test' },
    team: { id: 'team', name: 'Team', price: 99, docsLimit: null, multiUser: true, stripePriceId: 'price_team_test' },
  },
  getPlanByPriceId: jest.fn((priceId: string) => {
    const map: Record<string, string> = {
      price_essentials_test: 'essentials',
      price_pro_test: 'pro',
      price_team_test: 'team',
    };
    return map[priceId];
  }),
  getPlan: jest.fn((planId: string) => {
    const PLANS = {
      essentials: { id: 'essentials', docsLimit: 10, multiUser: false },
      pro: { id: 'pro', docsLimit: null, multiUser: false },
      team: { id: 'team', docsLimit: null, multiUser: true },
    };
    return PLANS[planId as keyof typeof PLANS];
  }),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', column: a, value: b })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  desc: jest.fn((a) => ({ type: 'desc', expr: a })),
  sql: jest.fn((strings, ...vals) => ({ type: 'sql', values: vals })),
  gte: jest.fn((a, b) => ({ type: 'gte', column: a, value: b })),
}));

const mockDb = { select: jest.fn(), update: jest.fn(), insert: jest.fn() };
jest.mock('@/lib/db', () => ({ __esModule: true, db: mockDb }));

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/tenant';
import stripeClient from '@/lib/stripe/client';
import { getPlan } from '@/lib/stripe/pricing';

const mockRequireAuth = requireAuth as jest.Mock;
const mockStripeCheckout = stripeClient.checkout.sessions.create as jest.Mock;
const mockStripePortal = stripeClient.billingPortal.sessions.create as jest.Mock;
const mockGetPlan = getPlan as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: any) => Promise.resolve(resolve(result))),
  };
  q[Symbol.toStringTag] = 'Promise';
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

function makeRequest(method: string, url: string, body?: any, searchParams?: Record<string, string>): NextRequest {
  const u = new URL(url);
  if (searchParams) Object.entries(searchParams).forEach(([k, v]) => u.searchParams.set(k, v));
  const req = new (NextRequest as any)(u.toString(), {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://docuhive.app' },
  });
  if (body) (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

describe('Billing Integration — Pricing ↔ Checkout ↔ Portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
    mockStripeCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      id: 'cs_test_123',
    });
    mockStripePortal.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/portal_123',
    });
  });

  // ── Checkout API (POST) ─────────────────────────────────────

  describe('POST /api/stripe/checkout — plan selection', () => {
    it('creates a Stripe checkout session for Essentials', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'essentials' });
      await POST(req);

      expect(mockStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_essentials_test', quantity: 1 }],
          metadata: { tenantId: 'tenant_xyz', plan: 'essentials' },
        })
      );
    });

    it('creates a Stripe checkout session for Pro', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'pro' });
      await POST(req);

      expect(mockStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_pro_test', quantity: 1 }],
          metadata: { tenantId: 'tenant_xyz', plan: 'pro' },
        })
      );
    });

    it('creates a Stripe checkout session for Team', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'team' });
      await POST(req);

      expect(mockStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [{ price: 'price_team_test', quantity: 1 }],
          metadata: { tenantId: 'tenant_xyz', plan: 'team' },
        })
      );
    });

    it('includes tenantId in metadata for webhook processing', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'pro' });
      await POST(req);

      expect(mockStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ tenantId: 'tenant_xyz' }),
        })
      );
    });

    it('uses subscription mode with correct success/cancel URLs', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'essentials' });
      await POST(req);

      expect(mockStripeCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          success_url: expect.stringContaining('/settings/billing'),
          cancel_url: expect.stringContaining('/pricing'),
        })
      );
    });

    it('returns the Stripe checkout URL and session ID', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'pro' });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
      expect(json.sessionId).toBe('cs_test_123');
    });

    it('rejects invalid plans', async () => {
      const { POST } = require('@/app/api/stripe/checkout/route');
      const req = makeRequest('POST', 'http://localhost:3000/api/stripe/checkout', { plan: 'invalid' });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Invalid plan');
    });
  });

  // ── Portal API (GET) ────────────────────────────────────────

  describe('GET /api/stripe/portal — billing redirect', () => {
    it('creates a portal session with customer ID', async () => {
      const { GET } = require('@/app/api/stripe/portal/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/stripe/portal', undefined, { customerId: 'cus_test_123' });
      await GET(req);

      expect(mockStripePortal).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        return_url: 'https://docuhive.app/settings/billing',
      });
    });

    it('returns the portal URL', async () => {
      const { GET } = require('@/app/api/stripe/portal/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/stripe/portal', undefined, { customerId: 'cus_test_123' });
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.url).toBe('https://billing.stripe.com/p/session/portal_123');
    });

    it('requires customerId parameter', async () => {
      const { GET } = require('@/app/api/stripe/portal/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/stripe/portal');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('customerId required');
    });
  });

  // ── Billing Subscription Data API (GET) ─────────────────────

  describe('GET /api/billing/subscription — subscription info', () => {
    beforeEach(() => {
      mockDb.select.mockReturnValue(makeThenableSelect([
        { plan: 'essentials', stripeCustomerId: 'cus_test_123', stripeSubscriptionId: 'sub_test_456' },
      ]));
    });

    it('returns plan info for the authenticated tenant', async () => {
      // Need to handle multiple select calls: first for tenant, second for subscription
      const firstSelect = makeThenableSelect([
        { plan: 'pro', stripeCustomerId: 'cus_abc', stripeSubscriptionId: 'sub_xyz' },
      ]);
      const secondSelect = makeThenableSelect([
        { status: 'active', currentPeriodStart: new Date(), currentPeriodEnd: new Date(),
          documentsUsed: 5, stripePriceId: 'price_pro_test' },
      ]);
      mockDb.select.mockReturnValueOnce(firstSelect).mockReturnValueOnce(secondSelect);

      const { GET } = require('@/app/api/billing/subscription/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/billing/subscription');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan).toBe('pro');
      expect(json.stripeCustomerId).toBe('cus_abc');
      expect(json.subscription).toBeTruthy();
      expect(json.subscription.documentsUsed).toBe(5);
    });

    it('returns Essentials defaults when no subscription record exists', async () => {
      const tenantOnly = makeThenableSelect([
        { plan: 'essentials', stripeCustomerId: null, stripeSubscriptionId: null },
      ]);
      const emptySub = makeThenableSelect([]);
      mockDb.select.mockReturnValueOnce(tenantOnly).mockReturnValueOnce(emptySub);

      const { GET } = require('@/app/api/billing/subscription/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/billing/subscription');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan).toBe('essentials');
      expect(json.subscription).toBeNull();
    });

    it('returns Pro plan details', async () => {
      const tenantSelect = makeThenableSelect([
        { plan: 'pro', stripeCustomerId: 'cus_pro', stripeSubscriptionId: 'sub_pro' },
      ]);
      const subSelect = makeThenableSelect([
        { status: 'active', documentsUsed: 3, stripePriceId: 'price_pro_test',
          currentPeriodStart: new Date(), currentPeriodEnd: new Date() },
      ]);
      mockDb.select.mockReturnValueOnce(tenantSelect).mockReturnValueOnce(subSelect);

      const { GET } = require('@/app/api/billing/subscription/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/billing/subscription');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan).toBe('pro');
      expect(json.docsLimit).toBeNull(); // Pro = unlimited
      expect(json.multiUser).toBe(false);
    });

    it('returns Team plan details', async () => {
      const tenantSelect = makeThenableSelect([
        { plan: 'team', stripeCustomerId: 'cus_team', stripeSubscriptionId: 'sub_team' },
      ]);
      const subSelect = makeThenableSelect([
        { status: 'active', documentsUsed: 15, stripePriceId: 'price_team_test',
          currentPeriodStart: new Date(), currentPeriodEnd: new Date() },
      ]);
      mockDb.select.mockReturnValueOnce(tenantSelect).mockReturnValueOnce(subSelect);

      const { GET } = require('@/app/api/billing/subscription/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/billing/subscription');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan).toBe('team');
      expect(json.docsLimit).toBeNull(); // Team = unlimited
      expect(json.multiUser).toBe(true);
    });

    it('returns cancelled subscription status', async () => {
      const tenantSelect = makeThenableSelect([
        { plan: 'essentials', stripeCustomerId: 'cus_cancel', stripeSubscriptionId: 'sub_cancel' },
      ]);
      const subSelect = makeThenableSelect([
        { status: 'cancelled', documentsUsed: 10, stripePriceId: 'price_essentials_test',
          currentPeriodStart: new Date(), currentPeriodEnd: new Date() },
      ]);
      mockDb.select.mockReturnValueOnce(tenantSelect).mockReturnValueOnce(subSelect);

      const { GET } = require('@/app/api/billing/subscription/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/billing/subscription');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscription.status).toBe('cancelled');
    });
  });
});

describe('Usage API (GET /api/usage)', () => {
  it('returns document count for a given tenantId', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ count: 7 }]));

    const { GET } = require('@/app/api/usage/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/usage', undefined, { tenantId: 'tenant_xyz' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.documentsUsed).toBe(7);
  });

  it('returns 0 when no documents exist', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ count: 0 }]));

    const { GET } = require('@/app/api/usage/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/usage', undefined, { tenantId: 'tenant_xyz' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.documentsUsed).toBe(0);
  });

  it('requires tenantId parameter', async () => {
    const { GET } = require('@/app/api/usage/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/usage');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('tenantId required');
  });
});