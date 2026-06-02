// ── Auth Enforcement Integration Tests ────────────────────────────
// Tests that every API route properly enforces authentication.
// The gap analysis flagged 5 missing auth holes.

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

const mockAuth = { requireAuth: jest.fn() };
jest.mock('@/lib/auth/tenant', () => {
  const AuthError = class AuthError extends Error {
    constructor(m: string) { super(m); this.name = 'AuthError'; }
  };
  return { __esModule: true, ...mockAuth, AuthError };
});

jest.mock('@/lib/db', () => ({
  __esModule: true,
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    then: jest.fn((resolve: any) => Promise.resolve([])),
  },
}));

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
    essentials: { id: 'essentials', docsLimit: 10 },
    pro: { id: 'pro', docsLimit: null },
    team: { id: 'team', docsLimit: null, multiUser: true },
  },
}));

jest.mock('@/lib/documents/generate', () => ({
  __esModule: true,
  generateDocument: jest.fn(),
}));

jest.mock('@/lib/documents/pdf', () => ({ __esModule: true, renderers: {} }));
jest.mock('@/lib/documents/word', () => ({ __esModule: true, generators: {} }));
jest.mock('@clerk/nextjs/server', () => ({ __esModule: true, clerkClient: jest.fn() }));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', column: a, value: b })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  desc: jest.fn((a) => ({ type: 'desc', expr: a })),
  sql: jest.fn((strings, ...vals) => ({ type: 'sql', values: vals })),
  gte: jest.fn((a, b) => ({ type: 'gte', column: a, value: b })),
}));

import { NextRequest } from 'next/server';
const { requireAuth, AuthError } = require('@/lib/auth/tenant');
const mockRequireAuth = requireAuth as jest.Mock;

function makeRequest(method: string, url: string): NextRequest {
  return new (NextRequest as any)(url, {
    method,
    headers: { 'content-type': 'application/json', 'origin': 'https://docuhive.app' },
  });
}

function makePostRequest(body: Record<string, any>): NextRequest {
  const req = new (NextRequest as any)('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'origin': 'https://docuhive.app' },
  });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

describe('Auth Enforcement Across All API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  describe('Endpoints that ENFORCE auth', () => {
    it('POST /api/documents/generate enforces auth', async () => {
      const { POST } = require('@/app/api/documents/generate/route');
      const req = makePostRequest({ type: 'employment_contract', title: 'Test' });

      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/documents enforces auth', async () => {
      const { GET } = require('@/app/api/documents/route');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/documents/:id enforces auth', async () => {
      const { GET } = require('@/app/api/documents/[id]/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc123');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET(req, { params: { id: 'doc123' } });
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/documents/:id/download (PDF) enforces auth', async () => {
      const { GET } = require('@/app/api/documents/[id]/download/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc123/download');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET(req, { params: { id: 'doc123' } });
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/dashboard enforces auth', async () => {
      const { GET } = require('@/app/api/dashboard/route');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/tenants/members enforces auth', async () => {
      const { GET } = require('@/app/api/tenants/members/route');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/billing/subscription enforces auth', async () => {
      const { GET } = require('@/app/api/billing/subscription/route');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });

    it('GET /api/legislative-updates enforces auth', async () => {
      const { GET } = require('@/app/api/legislative-updates/route');
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toContain('Unauthorized');
    });
  });

  describe('Endpoints that DO NOT enforce auth (KNOWN GAPS)', () => {
    it('GET /api/documents/:id/download/word does NOT enforce auth — KNOWN GAP', async () => {
      const { GET } = require('@/app/api/documents/[id]/download/word/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc123/download/word');
      const res = await GET(req, { params: { id: 'doc123' } });
      expect(res.status).not.toBe(401);
    });

    it('GET /api/usage does NOT enforce auth — KNOWN GAP (code-audit verified)', () => {
      const fs = require('fs');
      const code = fs.readFileSync('/home/hermes/projects/docuhive/app/api/usage/route.ts', 'utf8');
      expect(code).not.toContain('requireAuth');
      expect(code).toContain("searchParams.get('tenantId'");
    });

    it('GET /api/stripe/portal does NOT enforce auth — KNOWN GAP', async () => {
      const { GET } = require('@/app/api/stripe/portal/route');
      const req = makeRequest('GET', 'http://localhost:3000/api/stripe/portal?customerId=test');
      const res = await GET(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe('Public endpoints (no auth needed by design)', () => {
    it('GET /api/templates is public — no auth required (code-audit verified)', () => {
      const fs = require('fs');
      const code = fs.readFileSync('/home/hermes/projects/docuhive/app/api/templates/route.ts', 'utf8');
      expect(code).not.toContain('requireAuth');
      expect(code).toContain('documentTemplates');
    });
  });
});