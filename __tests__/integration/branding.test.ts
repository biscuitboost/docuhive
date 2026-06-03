// ── Branding Integration Tests ────────────────────────────────
// Tests GET /api/tenants returns branding fields,
// PATCH /api/tenants saves and validates branding fields,
// and loadBranding() helper returns defaults vs saved values.

jest.mock('next/server', () => {
  const createResponse = (body: any, init: ResponseInit = {}) => {
    const headers = new Headers(init.headers);
    const status = init.status ?? 200;
    return { status, headers, json: async () => body, ok: status >= 200 && status < 300, body: JSON.stringify(body) };
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

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', column: a, value: b })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  desc: jest.fn((a) => ({ type: 'desc', expr: a })),
  sql: jest.fn((strings, ...vals) => ({ type: 'sql', values: vals })),
  gte: jest.fn((a, b) => ({ type: 'gte', column: a, value: b })),
  count: jest.fn(() => ({ type: 'count' })),
}));

const mockDb = { select: jest.fn(), update: jest.fn(), insert: jest.fn(), delete: jest.fn() };
jest.mock('@/lib/db', () => ({ __esModule: true, db: mockDb }));

jest.mock('@clerk/nextjs/server', () => ({
  __esModule: true,
  clerkClient: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/tenant';

const mockRequireAuth = requireAuth as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  };
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

function makeUpdateChain(returnRows: any[] = []) {
  const chain: any = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(returnRows),
  };
  chain.then = jest.fn((resolve: (v: any) => any) => Promise.resolve(returnRows).then(resolve));
  return chain;
}

function makeRequest(method: string, url: string, body?: any): NextRequest {
  const req = new (NextRequest as any)(url, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://docuhive.app' },
  });
  if (body) (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

const sampleTenant = {
  name: "Acme Corp",
  logoUrl: "https://example.com/logo.png",
  primaryColor: "#ff6600",
  documentFooter: "Confidential",
  documentHeader: "Acme Corp",
};

// ── GET /api/tenants ─────────────────────────────────────────

describe('GET /api/tenants — branding fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns branding fields (logoUrl, primaryColor, etc.)', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleTenant]));

    const { GET } = require('@/app/api/tenants/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/tenants');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.branding).toBeDefined();
    expect(json.branding.logoUrl).toBe('https://example.com/logo.png');
    expect(json.branding.primaryColor).toBe('#ff6600');
    expect(json.branding.documentFooter).toBe('Confidential');
    expect(json.branding.documentHeader).toBe('Acme Corp');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new (require('@/lib/auth/tenant').AuthError)('Unauthorized'));

    const { GET } = require('@/app/api/tenants/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain('Unauthorized');
  });

  it('returns 404 when tenant not found', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { GET } = require('@/app/api/tenants/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('not found');
  });
});

// ── PATCH /api/tenants ───────────────────────────────────────

describe('PATCH /api/tenants — saves branding fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('saves branding fields (logoUrl, primaryColor)', async () => {
    const updatedBranding = {
      ...sampleTenant,
      logoUrl: 'https://example.com/new-logo.png',
      primaryColor: '#00aaff',
    };
    mockDb.update.mockReturnValue(makeUpdateChain([updatedBranding]));

    const { PATCH } = require('@/app/api/tenants/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/tenants', {
      branding: {
        logoUrl: 'https://example.com/new-logo.png',
        primaryColor: '#00aaff',
      },
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.branding.logoUrl).toBe('https://example.com/new-logo.png');
    expect(json.branding.primaryColor).toBe('#00aaff');
  });

  it('rejects invalid branding data (non-string primaryColor)', async () => {
    const { PATCH } = require('@/app/api/tenants/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/tenants', {
      branding: {
        primaryColor: 12345, // invalid — not a string
      },
    });
    const res = await PATCH(req);
    const json = await res.json();

    // Should be rejected because the valid field check fails
    expect(res.status).toBe(400);
    expect(json.error).toContain('No valid fields');
  });

  it('rejects when no valid fields are provided', async () => {
    const { PATCH } = require('@/app/api/tenants/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/tenants', {});
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('No valid fields');
  });
});

// ── loadBranding() helper ────────────────────────────────────

describe('loadBranding() helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defaults when no tenant is found', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    // Dynamic import to avoid hoisting issues with the mock
    const { loadBranding } = require('@/lib/documents/branding');
    const result = await loadBranding('nonexistent_tenant');

    expect(result.logoUrl).toBeNull();
    expect(result.primaryColor).toBe('#2563eb');
    expect(result.documentFooter).toBeNull();
    expect(result.documentHeader).toBeNull();
  });

  it('returns defaults when DB query throws an error', async () => {
    // Simulate a DB error: select returns non-thenable (throw path)
    const brokenSelect = { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis() };
    Object.defineProperty(brokenSelect, 'then', { value: undefined });
    mockDb.select.mockReturnValue(brokenSelect);

    const { loadBranding } = require('@/lib/documents/branding');
    const result = await loadBranding('tenant_xyz');

    expect(result.logoUrl).toBeNull();
    expect(result.primaryColor).toBe('#2563eb');
    expect(result.documentFooter).toBeNull();
    expect(result.documentHeader).toBeNull();
  });

  it('returns saved branding values when set', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff6600',
      documentFooter: 'Footer text',
      documentHeader: 'Header text',
    }]));

    const { loadBranding } = require('@/lib/documents/branding');
    const result = await loadBranding('tenant_xyz');

    expect(result.logoUrl).toBe('https://example.com/logo.png');
    expect(result.primaryColor).toBe('#ff6600');
    expect(result.documentFooter).toBe('Footer text');
    expect(result.documentHeader).toBe('Header text');
  });

  it('uses default primaryColor when saved value is null', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{
      logoUrl: null,
      primaryColor: null,
      documentFooter: null,
      documentHeader: null,
    }]));

    const { loadBranding } = require('@/lib/documents/branding');
    const result = await loadBranding('tenant_xyz');

    expect(result.logoUrl).toBeNull();
    expect(result.primaryColor).toBe('#2563eb'); // default
    expect(result.documentFooter).toBeNull();
    expect(result.documentHeader).toBeNull();
  });
});
