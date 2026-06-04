// ── Public API (v1 / api-key authed) Route Tests ─────────────────
// Tests for POST /api/v1/documents/generate — auth via Bearer token

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

jest.mock('@/lib/auth/public-api', () => {
  const PublicAuthError = class PublicAuthError extends Error {
    constructor(m: string, public status: number = 401) { super(m); this.name = 'PublicAuthError'; }
  };
  return { __esModule: true, authenticatePublicRequest: jest.fn(), PublicAuthError };
});

jest.mock('@/lib/documents/generate', () => ({
  __esModule: true,
  generateDocument: jest.fn(),
}));

jest.mock('@/lib/db', () => {
  const mockDb = {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  };
  return { __esModule: true, db: mockDb };
});

jest.mock('@/lib/documents/notifications', () => ({
  __esModule: true,
  createNotification: jest.fn().mockResolvedValue(undefined),
}));

// Make the query helper for the select chain
const mockDb = require('@/lib/db').db as jest.Mocked<typeof import('@/lib/db').db>;
const { generateDocument } = require('@/lib/documents/generate');
const { authenticatePublicRequest } = require('@/lib/auth/public-api');
const { PublicAuthError } = require('@/lib/auth/public-api');

import { NextRequest } from 'next/server';

// ── Helpers ───────────────────────────────────────────────────

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: 'Promise',
  };
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

function makeUpdateChain(returnResult?: any[]) {
  return {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(returnResult ?? [{ documentsUsed: 1 }]),
  };
}

function makePostRequest(body: Record<string, any>, token?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  const req = new (NextRequest as any)('http://localhost:3000/api/v1/documents/generate', {
    method: 'POST',
    headers,
  });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

// ── Tests ─────────────────────────────────────────────────────

describe('POST /api/v1/documents/generate — Public API', () => {
  const validToken = 'dhv1_ABC123def456ghi789jkl012mno345';
  const mockAuthResult = { tenantId: 'tenant_xyz', apiKeyId: 'key_001', keyName: 'Production' };

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatePublicRequest as jest.Mock).mockResolvedValue(mockAuthResult);
    (generateDocument as jest.Mock).mockResolvedValue({
      documentId: 'doc_001',
      content: { clause_1: 'Test content' },
      outputUrl: null,
      model: 'deepseek/deepseek-chat',
    });
  });

  // ── Auth tests ─────────────────────────────────────────────

  it('returns 401 when no auth header', async () => {
    (authenticatePublicRequest as jest.Mock).mockRejectedValue(
      new PublicAuthError('Missing Authorization header', 401)
    );

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({ docType: 'employment_contract', title: 'Test' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain('Missing Authorization');
  });

  it('returns 403 when key is disabled', async () => {
    (authenticatePublicRequest as jest.Mock).mockRejectedValue(
      new PublicAuthError('API key is disabled', 403)
    );

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({ docType: 'employment_contract', title: 'Test' }, validToken);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('disabled');
  });

  it('returns 401 for invalid key format', async () => {
    (authenticatePublicRequest as jest.Mock).mockRejectedValue(
      new PublicAuthError('Invalid API key format', 401)
    );

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({ docType: 'employment_contract', title: 'Test' }, 'bad-key');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toContain('Invalid');
  });

  // ── Plan limit tests ───────────────────────────────────────

  it('enforces monthly document limits', async () => {
    // First db.select() call = getPlanLimit (subscriptions query)
    // Second db.select() call = count query (documents count)
    mockDb.select
      .mockReturnValueOnce(makeThenableSelect([
        { plan: 'essentials', status: 'active', documentsUsed: 0 },
      ]))
      .mockReturnValueOnce(makeThenableSelect([{ count: 10 }]));

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({ docType: 'employment_contract', title: 'Test' }, validToken);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toContain('Monthly document limit reached');
  });

  // ── Successful generation tests ─────────────────────────────

  it('generates a document successfully', async () => {
    // Subscription query — no plan limit (Pro plan = null limit)
    mockDb.select.mockReturnValue(makeThenableSelect([
      { plan: 'pro', status: 'active', documentsUsed: 0 },
    ]));
    // Update returns success
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({
      docType: 'employment_contract',
      title: 'Employee Contract',
      userInputs: { employee_name: 'Jane', job_title: 'Engineer' },
    }, validToken);

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.documentId).toBe('doc_001');
    expect(json.content).toBeDefined();
    expect(json.model).toBeDefined();
    // Should NOT return outputUrl or other internal fields
    expect(json).not.toHaveProperty('outputUrl');
  });

  it('overrides tenantId with the value from API key auth', async () => {
    // This is critical: a client sending their own tenantId must be rejected
    mockDb.select.mockReturnValue(makeThenableSelect([
      { plan: 'pro', status: 'active', documentsUsed: 0 },
    ]));
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({
      docType: 'employment_contract',
      title: 'Test',
      tenantId: 'tenant_hacker', // Should be overridden
    }, validToken);

    await POST(req);

    // The generate function should have been called with the authenticated tenant's ID
    const genCall = (generateDocument as jest.Mock).mock.calls[0][0];
    expect(genCall.tenantId).toBe('tenant_xyz');
    expect(genCall.tenantId).not.toBe('tenant_hacker');
  });

  it('handles AI generation errors gracefully', async () => {
    (generateDocument as jest.Mock).mockRejectedValue(new Error('AI provider error'));

    mockDb.select.mockReturnValue(makeThenableSelect([
      { plan: 'pro', status: 'active', documentsUsed: 0 },
    ]));

    const { POST } = require('@/app/api/v1/documents/generate/route');
    const req = makePostRequest({ docType: 'employment_contract', title: 'Test' }, validToken);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toContain('AI provider error');
  });
});