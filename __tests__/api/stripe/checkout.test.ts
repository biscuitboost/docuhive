// ── Stripe Checkout API Route Tests ───────────────────────────────
// Tests for POST and GET /api/stripe/checkout

// Mock next/server entirely — API route tests don't need the real runtime
jest.mock('next/server', () => {
  const createResponse = (body: any, init: ResponseInit = {}) => {
    const headers = new Headers(init.headers);
    const status = init.status ?? 200;
    return {
      status,
      headers,
      json: async () => body,
      ok: status >= 200 && status < 300,
      body: JSON.stringify(body),
    };
  };

  return {
    NextResponse: {
      json: (body: any, init?: ResponseInit) => createResponse(body, init),
    },
    NextRequest: class MockNextRequest {
      public url: string;
      public headers: Headers;
      public method: string;
      private bodyFn: (() => Promise<any>) | undefined;

      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
        this.bodyFn = undefined;
      }

      async json() {
        return this.bodyFn ? this.bodyFn() : {};
      }

      _setBody(fn: () => Promise<any>) {
        this.bodyFn = fn;
      }
    },
  };
});

// Mock lib dependencies
jest.mock('@/lib/stripe/client', () => ({
  __esModule: true,
  default: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('@/lib/auth/tenant', () => ({
  __esModule: true,
  requireAuth: jest.fn(),
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
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
      essentials: { id: 'essentials', name: 'Essentials', price: 49, docsLimit: 10, multiUser: false, stripePriceId: 'price_essentials_test' },
      pro: { id: 'pro', name: 'Pro', price: 79, docsLimit: null, multiUser: false, stripePriceId: 'price_pro_test' },
      team: { id: 'team', name: 'Team', price: 99, docsLimit: null, multiUser: true, stripePriceId: 'price_team_test' },
    };
    return PLANS[planId as keyof typeof PLANS];
  }),
}));

import { NextRequest } from 'next/server';
import stripeClient from '@/lib/stripe/client';
import { requireAuth, AuthError } from '@/lib/auth/tenant';
import { PLANS } from '@/lib/stripe/pricing';

// Module under test
const { POST, GET } = require('@/app/api/stripe/checkout/route') as {
  POST: (req: NextRequest) => Promise<any>;
  GET: (req: NextRequest) => Promise<any>;
};

const mockStripeCreate = stripeClient.checkout.sessions.create as jest.Mock;
const mockRequireAuth = requireAuth as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────

function makePostRequest(body: Record<string, any> = {}, origin?: string): NextRequest {
  const req = new (NextRequest as any)('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(origin !== undefined ? { origin } : {}),
    },
  });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

function makeGetRequest(searchParams: Record<string, string> = {}, origin?: string): NextRequest {
  const url = new URL('http://localhost:3000/api/stripe/checkout');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  const req = new (NextRequest as any)(url.toString(), {
    method: 'GET',
    headers: {
      ...(origin !== undefined ? { origin } : {}),
    },
  });
  return req;
}

// ── POST /api/stripe/checkout ─────────────────────────────────────

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc123', tenantId: 'tenant_test_001' });
    mockStripeCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/test_session_123',
      id: 'cs_test_abc123',
    });
  });

  // ── Auth ────────────────────────────────────────────────────

  it('rejects unauthenticated requests with 401', async () => {
    mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized — no valid session'));

    const req = makePostRequest({ plan: 'essentials' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain('Unauthorized');
    expect(mockStripeCreate).not.toHaveBeenCalled();
  });

  // ── Validation ──────────────────────────────────────────────

  it('defaults to essentials plan when no plan is provided', async () => {
    const req = makePostRequest({});
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_essentials_test', quantity: 1 }],
        metadata: { tenantId: 'tenant_test_001', plan: 'essentials' },
      })
    );
    expect(json.url).toContain('checkout.stripe.com');
  });

  it('accepts a valid plan ID', async () => {
    const req = makePostRequest({ plan: 'pro' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_test', quantity: 1 }],
        metadata: { tenantId: 'tenant_test_001', plan: 'pro' },
      })
    );
    expect(json.url).toBe('https://checkout.stripe.com/c/pay/test_session_123');
    expect(json.sessionId).toBe('cs_test_abc123');
  });

  it('rejects an invalid plan with 400', async () => {
    const req = makePostRequest({ plan: 'ultra-premium' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid plan');
    expect(mockStripeCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid data types in plan field', async () => {
    const req = makePostRequest({ plan: 123 });
    const res = await POST(req);
    const json = await res.json();

    // Zod says "Expected string, received number" for non-string types
    expect(res.status).toBe(400);
    expect(json.error).toContain('Expected string');
  });

  // ── Stripe integration ─────────────────────────────────────

  it('passes correct metadata to Stripe', async () => {
    const req = makePostRequest({ plan: 'team' });
    await POST(req);

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        metadata: { tenantId: 'tenant_test_001', plan: 'team' },
      })
    );
  });

  it('uses the correct success_url and cancel_url', async () => {
    const req = makePostRequest({ plan: 'essentials' });
    await POST(req);

    const callArgs = mockStripeCreate.mock.calls[0][0];
    expect(callArgs.success_url).toContain('/settings/billing?success=true');
    expect(callArgs.success_url).toContain('{CHECKOUT_SESSION_ID}');
    expect(callArgs.cancel_url).toContain('/pricing?canceled=true');
  });

  it('falls back to default origin when no origin header', async () => {
    const oldUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://docuhive.app';

    const req = makePostRequest({ plan: 'essentials' });
    await POST(req);

    const callArgs = mockStripeCreate.mock.calls[0][0];
    expect(callArgs.success_url).toMatch(/^https:\/\/docuhive\.app\//);
    expect(callArgs.cancel_url).toMatch(/^https:\/\/docuhive\.app\//);

    process.env.NEXT_PUBLIC_APP_URL = oldUrl;
  });

  it('returns 500 when Stripe API call fails', async () => {
    mockStripeCreate.mockRejectedValue(new Error('stripe_error: insufficient balance'));

    const req = makePostRequest({ plan: 'essentials' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('stripe_error');
  });
});

// ── GET /api/stripe/checkout ─────────────────────────────────────

describe('GET /api/stripe/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStripeCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/test_session_456',
      id: 'cs_test_def456',
    });
  });

  it('creates a Stripe checkout session for a valid plan', async () => {
    const req = makeGetRequest({ plan: 'pro' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toContain('checkout.stripe.com');
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_pro_test', quantity: 1 }],
      })
    );
  });

  it('defaults to essentials plan when no plan query param', async () => {
    const req = makeGetRequest({});
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_essentials_test', quantity: 1 }],
      })
    );
    expect(json.url).toBe('https://checkout.stripe.com/c/pay/test_session_456');
  });

  it('rejects an invalid plan with 400', async () => {
    const req = makeGetRequest({ plan: 'nonexistent' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid plan');
    expect(mockStripeCreate).not.toHaveBeenCalled();
  });

  it('includes tenantId in metadata when provided as query param', async () => {
    const req = makeGetRequest({ plan: 'essentials', tenantId: 'tenant_abc' });
    await GET(req);

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { tenantId: 'tenant_abc', plan: 'essentials' },
      })
    );
  });

  it('omits tenantId from metadata when not provided', async () => {
    const req = makeGetRequest({ plan: 'essentials' });
    await GET(req);

    const callArgs = mockStripeCreate.mock.calls[0][0];
    expect(callArgs.metadata).toEqual({ plan: 'essentials' });
    expect(callArgs.metadata.tenantId).toBeUndefined();
  });

  it('returns 500 when Stripe throws', async () => {
    mockStripeCreate.mockRejectedValue(new Error('rate limit exceeded'));

    const req = makeGetRequest({ plan: 'essentials' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('rate limit exceeded');
  });

  it('uses fallback origin when no header present', async () => {
    const oldUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://docuhive.app';

    const req = makeGetRequest({ plan: 'essentials' });
    await GET(req);

    const callArgs = mockStripeCreate.mock.calls[0][0];
    expect(callArgs.success_url).toMatch(/^https:\/\/docuhive\.app\//);

    process.env.NEXT_PUBLIC_APP_URL = oldUrl;
  });
});
