// ── Stripe Billing Portal API Route Tests ──────────────────────────
// Tests for GET /api/stripe/portal
// Route uses requireAuth() + DB lookup for the tenant's stripeCustomerId.

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

      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
      }
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
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('@clerk/nextjs/server', () => ({ __esModule: true, clerkClient: jest.fn() }));

import { NextRequest } from 'next/server';
import stripeClient from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/tenant';

const mockRequireAuth = requireAuth as jest.Mock;
const mockPortalCreate = stripeClient.billingPortal.sessions.create as jest.Mock;

// Mock DB
jest.mock('@/lib/db', () => ({
  __esModule: true,
  db: {
    select: jest.fn(),
  },
}));

const { db } = require('@/lib/db');

const { GET } = require('@/app/api/stripe/portal/route') as {
  GET: (req: NextRequest) => Promise<any>;
};

function makeGetRequest(): NextRequest {
  const url = new URL('http://localhost:3000/api/stripe/portal');
  return new (NextRequest as any)(url.toString(), { method: 'GET' });
}

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: any) => Promise.resolve(resolve(result))),
  };
  q[Symbol.toStringTag] = 'Promise';
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

describe('GET /api/stripe/portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
    mockPortalCreate.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/test_portal_123',
    });
  });

  it('creates a billing portal session for the authenticated tenant', async () => {
    db.select.mockReturnValue(makeThenableSelect([
      { stripeCustomerId: 'cus_abc123' },
    ]));

    const req = makeGetRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe('https://billing.stripe.com/p/session/test_portal_123');
  });

  it('passes customer ID and return URL correctly to Stripe', async () => {
    db.select.mockReturnValue(makeThenableSelect([
      { stripeCustomerId: 'cus_test_456' },
    ]));

    process.env.NEXT_PUBLIC_APP_URL = 'https://docuhive.app';

    const req = makeGetRequest();
    await GET(req);

    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_test_456',
      return_url: 'https://docuhive.app/settings/billing',
    });
  });

  it('returns 400 when tenant has no stripe customer ID (not subscribed)', async () => {
    db.select.mockReturnValue(makeThenableSelect([
      { stripeCustomerId: null },
    ]));

    const req = makeGetRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('No subscription found');
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it('returns 400 when no tenant record exists', async () => {
    db.select.mockReturnValue(makeThenableSelect([]));

    const req = makeGetRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('No subscription found');
  });

  it('returns 500 when Stripe API call fails', async () => {
    db.select.mockReturnValue(makeThenableSelect([
      { stripeCustomerId: 'cus_fake' },
    ]));
    mockPortalCreate.mockRejectedValue(new Error('No such customer: cus_fake'));

    const req = makeGetRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('No such customer');
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(
      new (require('@/lib/auth/tenant').AuthError)('Unauthorized')
    );

    const req = makeGetRequest();
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
  });
});