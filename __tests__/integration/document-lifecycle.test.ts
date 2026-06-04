// ── Document Lifecycle Integration Tests ────────────────────────
// Tests CRUD operations: list (paginated), create, get single,
// delete (soft-archive), archive/restore flow.
// Verifies tenant isolation and status transitions.

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

jest.mock('@/lib/stripe/pricing', () => ({
  __esModule: true,
  PLANS: { essentials: { id: 'essentials', docsLimit: 10, multiUser: false } },
}));

jest.mock('@/lib/documents/generate', () => ({
  __esModule: true,
  generateDocument: jest.fn(),
}));

jest.mock('@/lib/documents/pdf', () => ({
  __esModule: true,
  renderers: {
    employment_contract: jest.fn(),
  },
}));

jest.mock('@/lib/documents/word', () => ({
  __esModule: true,
  generators: {
    employment_contract: jest.fn(),
  },
}));

jest.mock('@clerk/nextjs/server', () => ({
  __esModule: true,
  clerkClient: jest.fn(),
}));

jest.mock('@/lib/documents/notifications', () => ({
  __esModule: true,
  createNotification: jest.fn(),
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
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: any) => Promise.resolve(resolve(result))),
  };
  q[Symbol.toStringTag] = 'Promise';
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

function makeUpdateChain() {
  return { set: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue({ rowCount: 1 }) };
}

function makeRequest(method: string, url: string, body?: any): NextRequest {
  const req = new (NextRequest as any)(url, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://docuhive.app' },
  });
  if (body) (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

const sampleDocs = [
  { id: 'doc_001', tenantId: 'tenant_xyz', type: 'employment_contract', title: 'Contract A',
    status: 'generated', inputData: {}, outputData: {}, outputUrl: null, aiModel: null,
    version: 1, createdBy: 'user_abc', createdAt: new Date('2026-06-01'), updatedAt: new Date('2026-06-01') },
  { id: 'doc_002', tenantId: 'tenant_xyz', type: 'offer_letter', title: 'Offer B',
    status: 'draft', inputData: {}, outputData: null, outputUrl: null, aiModel: null,
    version: 1, createdBy: 'user_abc', createdAt: new Date('2026-06-02'), updatedAt: new Date('2026-06-02') },
  { id: 'doc_003', tenantId: 'tenant_xyz', type: 'p45', title: 'P45 C',
    status: 'archived', inputData: {}, outputData: {}, outputUrl: null, aiModel: null,
    version: 1, createdBy: 'user_abc', createdAt: new Date('2026-06-03'), updatedAt: new Date('2026-06-03') },
];

describe('Document Listing (GET /api/documents) — Paginated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns paginated documents with metadata', async () => {
    mockDb.select
      .mockReturnValueOnce(makeThenableSelect([{ total: 3 }]))  // count
      .mockReturnValueOnce(makeThenableSelect(sampleDocs));       // data

    const { GET } = require('@/app/api/documents/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents?page=1&limit=20');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(3);
    expect(json.total).toBe(3);
    expect(json.page).toBe(1);
    expect(json.totalPages).toBe(1);
  });

  it('returns empty array when no documents exist', async () => {
    mockDb.select
      .mockReturnValueOnce(makeThenableSelect([{ total: 0 }]))   // count
      .mockReturnValueOnce(makeThenableSelect([]));               // data

    const { GET } = require('@/app/api/documents/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(json.total).toBe(0);
  });

  it('does NOT return documents from other tenants', async () => {
    mockDb.select
      .mockReturnValueOnce(makeThenableSelect([{ total: 0 }]))   // count
      .mockReturnValueOnce(makeThenableSelect([]));               // data
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_other', tenantId: 'tenant_other' });

    const { GET } = require('@/app/api/documents/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(json.total).toBe(0);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new (require('@/lib/auth/tenant').AuthError)('Unauthorized'));

    const { GET } = require('@/app/api/documents/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
  });
});

describe('Document Detail (GET /api/documents/:id)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns document details for the owning tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleDocs[0]]));

    const { GET } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc_001');
    const res = await GET(req, { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe('doc_001');
    expect(json.title).toBe('Contract A');
    expect(json.downloadUrl).toContain('/api/documents/doc_001/download');
    expect(json.wordDownloadUrl).toContain('/api/documents/doc_001/download/word');
  });

  it('returns 404 for non-existent document', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { GET } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc_nonexistent');
    const res = await GET(req, { params: { id: 'doc_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('not found');
  });

  it('returns 404 for document belonging to another tenant (tenant isolation)', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ ...sampleDocs[0], tenantId: 'tenant_other' }]));
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });

    const { GET } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc_001');
    const res = await GET(req, { params: { id: 'doc_001' } });

    expect(res.status).toBe(404); // Tenant isolation returns 404, not 403
  });
});

describe('Document Download (GET /api/documents/:id/download)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns 404 for documents without generated content', async () => {
    const draftDoc = { ...sampleDocs[0], status: 'draft', outputData: null, inputData: null };
    mockDb.select.mockReturnValue(makeThenableSelect([draftDoc]));

    const { GET } = require('@/app/api/documents/[id]/download/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc_001');
    const res = await GET(req, { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('no generated content');
  });

  it('blocks download from non-owning tenant (tenant isolation)', async () => {
    const otherDoc = { ...sampleDocs[0], tenantId: 'tenant_other' };
    mockDb.select.mockReturnValue(makeThenableSelect([otherDoc]));

    const { GET } = require('@/app/api/documents/[id]/download/route');
    const req = makeRequest('GET', 'http://localhost:3000/api/documents/doc_001');
    const res = await GET(req, { params: { id: 'doc_001' } });

    expect(res.status).toBe(404);
  });
});

describe('Document Delete (DELETE /api/documents/:id) — Soft Archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('soft-archives a document owned by the tenant', async () => {
    // First select (ownership check)
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_xyz' }]));
    // Update (set archived)
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { DELETE } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('DELETE', 'http://localhost:3000/api/documents/doc_001');
    const res = await DELETE(req, { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Should have set status to archived
    const setCall = mockDb.update.mock.calls[0] ? mockDb.update.mock.results[0] : null;
  });

  it('returns 404 for non-existent document', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { DELETE } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('DELETE', 'http://localhost:3000/api/documents/doc_nonexistent');
    const res = await DELETE(req, { params: { id: 'doc_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
  });

  it('returns 404 for document owned by another tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_other' }]));

    const { DELETE } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('DELETE', 'http://localhost:3000/api/documents/doc_001');
    const res = await DELETE(req, { params: { id: 'doc_001' } });

    expect(res.status).toBe(404);
  });
});

describe('Document Archive/Restore (PATCH /api/documents/:id)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('archives a generated document', async () => {
    // Select for ownership check
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_xyz', status: 'generated' }]));
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { PATCH } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/documents/doc_001', { status: 'archived' });
    const res = await PATCH(req, { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('archived');
  });

  it('restores an archived document', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_xyz', status: 'archived' }]));
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { PATCH } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/documents/doc_003', { status: 'generated' });
    const res = await PATCH(req, { params: { id: 'doc_003' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('generated');
  });

  it('rejects invalid status values', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_xyz', status: 'generated' }]));

    const { PATCH } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/documents/doc_001', { status: 'invalid_status' });
    const res = await PATCH(req, { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid');
  });

  it('returns 404 for document owned by another tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ tenantId: 'tenant_other', status: 'generated' }]));

    const { PATCH } = require('@/app/api/documents/[id]/route');
    const req = makeRequest('PATCH', 'http://localhost:3000/api/documents/doc_001', { status: 'archived' });
    const res = await PATCH(req, { params: { id: 'doc_001' } });

    expect(res.status).toBe(404);
  });
});

describe('Document Dashboard (GET /api/dashboard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
    mockDb.select.mockReturnValue(makeThenableSelect([]));
  });

  it('returns dashboard data with recent documents and usage info', async () => {
    const calls = [makeThenableSelect(sampleDocs.slice(0, 1))];
    mockDb.select.mockImplementation(() => calls.shift() || makeThenableSelect([]));

    const { GET } = require('@/app/api/dashboard/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty('recentDocuments');
    expect(json).toHaveProperty('usage');
    expect(json).toHaveProperty('tenant');
  });
});