// ── Stripe Billing Portal API Route Tests ──────────────────────────
// Tests for GET /api/stripe/portal

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

import { NextRequest } from 'next/server';
import stripeClient from '@/lib/stripe/client';

const { GET } = require('@/app/api/stripe/portal/route') as {
  GET: (req: NextRequest) => Promise<any>;
};

const mockPortalCreate = stripeClient.billingPortal.sessions.create as jest.Mock;

function makeGetRequest(
  searchParams: Record<string, string> = {},
  origin?: string
): NextRequest {
  const url = new URL('http://localhost:3000/api/stripe/portal');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {};
  if (origin !== undefined) {
    headers['origin'] = origin;
  }

  return new (NextRequest as any)(url.toString(), { method: 'GET', headers });
}

describe('GET /api/stripe/portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortalCreate.mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/test_portal_123',
    });
  });

  it('creates a billing portal session and returns the URL', async () => {
    const req = makeGetRequest({ customerId: 'cus_abc123' }, 'https://docuhive.app');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.url).toBe(
      'https://billing.stripe.com/p/session/test_portal_123'
    );
  });

  it('passes customer ID and return URL correctly to Stripe', async () => {
    const req = makeGetRequest({ customerId: 'cus_test_456' }, 'https://example.com');
    await GET(req);

    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_test_456',
      return_url: 'https://example.com/settings/billing',
    });
  });

  it('returns 400 when customerId is missing', async () => {
    const req = makeGetRequest({}); // no customerId
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('customerId required');
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when Stripe API call fails', async () => {
    mockPortalCreate.mockRejectedValue(
      new Error('No such customer: cus_fake')
    );

    const req = makeGetRequest({ customerId: 'cus_fake' }, 'http://localhost:3000');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('No such customer');
  });

  it('uses origin header for return_url', async () => {
    const req = makeGetRequest({ customerId: 'cus_xyz' }, 'https://myapp.com');
    await GET(req);

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: 'https://myapp.com/settings/billing',
      })
    );
  });
});
