// ── Stripe Webhook API Route Tests ─────────────────────────────────
// Tests for POST /api/stripe/webhook

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
      private bodyText: string | undefined;

      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
        this.bodyText = undefined;
      }

      async text() {
        return this.bodyText ?? '';
      }

      _setBody(text: string) {
        this.bodyText = text;
      }
    },
  };
});

jest.mock('@/lib/stripe/webhooks', () => ({
  __esModule: true,
  handleStripeWebhook: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';

const { POST } = require('@/app/api/stripe/webhook/route') as {
  POST: (req: NextRequest) => Promise<any>;
};

const mockHandleWebhook = handleStripeWebhook as jest.Mock;

function makePostRequest(body: string, signature?: string): NextRequest {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (signature !== undefined) {
    headers['stripe-signature'] = signature;
  }

  const req = new (NextRequest as any)(
    'http://localhost:3000/api/stripe/webhook',
    { method: 'POST', headers }
  );
  (req as any)._setBody(body);
  return req;
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleWebhook.mockResolvedValue({ received: true });
  });

  it('calls handleStripeWebhook with raw body and signature header', async () => {
    const body = JSON.stringify({ type: 'checkout.session.completed' });
    const req = makePostRequest(body, 'tse_abc123');
    await POST(req);

    expect(mockHandleWebhook).toHaveBeenCalledTimes(1);
    expect(mockHandleWebhook).toHaveBeenCalledWith(body, 'tse_abc123');
  });

  it('passes empty string for signature when header is missing', async () => {
    const body = JSON.stringify({ type: 'checkout.session.completed' });
    const req = makePostRequest(body); // no signature header
    await POST(req);

    expect(mockHandleWebhook).toHaveBeenCalledWith(body, '');
  });

  it('returns 200 with received:true on success', async () => {
    const req = makePostRequest('{}', 'tse_abc');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: true });
  });

  it('returns 400 when handleStripeWebhook throws', async () => {
    mockHandleWebhook.mockRejectedValue(
      new Error('No signatures found matching the expected signature')
    );

    const req = makePostRequest('{}', 'bad_sig');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('signature');
  });

  it('reads the request body as raw text', async () => {
    // Create a request using the constructor so _setBody is the only way to set body
    const req = makePostRequest(
      JSON.stringify({ type: 'customer.subscription.deleted' }),
      'tse_xyz'
    );
    await POST(req);

    // The body passed to handleStripeWebhook should be the raw text
    const callArg = mockHandleWebhook.mock.calls[0][0];
    expect(callArg).toBe(
      JSON.stringify({ type: 'customer.subscription.deleted' })
    );
  });
});
