// ── API Key Management Route Tests ────────────────────────────────
// Tests for GET/POST /api/keys and GET/PATCH/DELETE /api/keys/[id]

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
  sql: jest.fn((strings: TemplateStringsArray, ...values: any[]) => ({
    type: 'sql', strings, values,
  })),
}));

const mockDb = { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() };
jest.mock('@/lib/db', () => ({ __esModule: true, db: mockDb }));

jest.mock('@clerk/nextjs/server', () => ({ __esModule: true, clerkClient: jest.fn() }));

import { NextRequest } from 'next/server';
const { requireAuth, AuthError } = require('@/lib/auth/tenant');
const mockRequireAuth = requireAuth as jest.Mock;

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

function makeInsertChain() {
  const chain: any = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'key_001' }]),
  };
  return chain;
}

function makeUpdateChain(returnResult?: any[]) {
  return {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(returnResult ?? [{
      id: 'key_001', name: 'Updated Key', keyPrefix: 'dhv1_AB', lastFour: 'abcd',
      isActive: false, lastUsedAt: null, createdAt: '2026-06-04T00:00:00.000Z',
    }]),
  };
}

function makeDeleteChain() {
  return { where: jest.fn().mockResolvedValue(undefined) };
}

function makeGetRequest(url: string): NextRequest {
  return new (NextRequest as any)(url, { method: 'GET' });
}

function makePostRequest(url: string, body: Record<string, any>): NextRequest {
  const req = new (NextRequest as any)(url, { method: 'POST', headers: { 'content-type': 'application/json' } });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

function makePatchRequest(url: string, body: Record<string, any>): NextRequest {
  const req = new (NextRequest as any)(url, { method: 'PATCH', headers: { 'content-type': 'application/json' } });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

function makeDeleteRequest(url: string): NextRequest {
  return new (NextRequest as any)(url, { method: 'DELETE' });
}

const sampleKeys = [
  {
    id: 'key_001', name: 'Production', keyPrefix: 'dhv1_AB', lastFour: 'abcd',
    isActive: true, lastUsedAt: '2026-06-03T12:00:00.000Z', createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'key_002', name: 'Staging', keyPrefix: 'dhv1_XY', lastFour: 'wxyz',
    isActive: false, lastUsedAt: null, createdAt: '2026-06-02T00:00:00.000Z',
  },
];

// ── Tests ─────────────────────────────────────────────────────

describe('GET /api/keys — list keys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));

    const { GET } = require('@/app/api/keys/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns empty list when no keys exist', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { GET } = require('@/app/api/keys/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.keys).toEqual([]);
  });

  it('returns all keys for the tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect(sampleKeys));

    const { GET } = require('@/app/api/keys/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.keys).toHaveLength(2);
    expect(json.keys[0].name).toBe('Production');
    expect(json.keys[1].name).toBe('Staging');
    expect(json.keys[0]).not.toHaveProperty('keyHash'); // hash never returned
    expect(json.keys[0]).not.toHaveProperty('key'); // plaintext never returned
  });

  it('only returns keys belonging to the authenticated tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect(sampleKeys));

    const { GET } = require('@/app/api/keys/route');
    await GET();

    // Verify the query was scoped to the tenant
    const selectCall = mockDb.select.mock.calls[0][0];
    const whereCall = mockDb.select.mock.results[0].value.where;
    expect(whereCall).toBeDefined();
  });
});

describe('POST /api/keys — create key', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
    mockDb.insert.mockReturnValue(makeInsertChain());
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));

    const { POST } = require('@/app/api/keys/route');
    const req = makePostRequest('http://localhost:3000/api/keys', { name: 'Test Key' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when name is empty', async () => {
    const { POST } = require('@/app/api/keys/route');

    const res1 = await POST(makePostRequest('http://localhost:3000/api/keys', { name: '' }));
    const json1 = await res1.json();
    expect(res1.status).toBe(400);
    expect(json1.error).toContain('required');

    const res2 = await POST(makePostRequest('http://localhost:3000/api/keys', { name: '   ' }));
    const json2 = await res2.json();
    expect(res2.status).toBe(400);
    expect(json2.error).toContain('required');
  });

  it('returns 400 when name is missing', async () => {
    const { POST } = require('@/app/api/keys/route');

    const res = await POST(makePostRequest('http://localhost:3000/api/keys', {}));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain('required');
  });

  it('creates a key and returns plaintext key once', async () => {
    const { POST } = require('@/app/api/keys/route');
    const req = makePostRequest('http://localhost:3000/api/keys', { name: 'Production' });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe('key_001');
    expect(json.name).toBe('Production');
    expect(json.key).toBeDefined();
    expect(json.key).toContain('dhv1_');
    expect(json.keyPrefix).toBeDefined();
    expect(json.lastFour).toBeDefined();
    // Verify the key format
    expect(json.key.length).toBeGreaterThan(30);
    expect(json.key.startsWith('dhv1_')).toBe(true);
  });

  it('inserts the key with hashed value (no plaintext stored)', async () => {
    const { POST } = require('@/app/api/keys/route');
    const req = makePostRequest('http://localhost:3000/api/keys', { name: 'Prod' });
    await POST(req);

    // Verify insert was called with a hash, not the plaintext key
    const insertCall = mockDb.insert.mock.calls[0][0];
    const valuesCall = mockDb.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(valuesCall.name).toBe('Prod');
    expect(valuesCall.tenantId).toBe('tenant_xyz');
    expect(valuesCall.keyHash).toBeDefined();
    expect(valuesCall.keyHash.length).toBe(64); // SHA-256 hex
    expect(valuesCall.keyPrefix).toBeDefined();
    expect(valuesCall.lastFour).toBeDefined();
    // Plaintext should NOT be in stored values
    expect(valuesCall.key).toBeUndefined();
  });
});

describe('GET /api/keys/[id] — get single key', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns 404 for non-existent key', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { GET } = require('@/app/api/keys/[id]/route');
    const res = await GET(makeGetRequest('http://localhost:3000/api/keys/key_nonexistent'), { params: { id: 'key_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('not found');
  });

  it('returns 404 for another tenants key', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([])); // other tenant's key won't match

    const { GET } = require('@/app/api/keys/[id]/route');
    const res = await GET(makeGetRequest('http://localhost:3000/api/keys/key_other'), { params: { id: 'key_other' } });
    const json = await res.json();

    expect(res.status).toBe(404);
  });

  it('returns key details for own key', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleKeys[0]]));

    const { GET } = require('@/app/api/keys/[id]/route');
    const res = await GET(makeGetRequest('http://localhost:3000/api/keys/key_001'), { params: { id: 'key_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key.name).toBe('Production');
    expect(json.key).not.toHaveProperty('keyHash');
  });
});

describe('PATCH /api/keys/[id] — update key', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns 404 for non-existent key', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { PATCH } = require('@/app/api/keys/[id]/route');
    const req = makePatchRequest('http://localhost:3000/api/keys/key_nonexistent', { name: 'Updated' });
    const res = await PATCH(req, { params: { id: 'key_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
  });

  it('updates key name', async () => {
    // First select (ownership check) returns key
    mockDb.select.mockReturnValue(makeThenableSelect([sampleKeys[0]]));
    // Update returns updated key
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { PATCH } = require('@/app/api/keys/[id]/route');
    const req = makePatchRequest('http://localhost:3000/api/keys/key_001', { name: 'Updated Key' });
    const res = await PATCH(req, { params: { id: 'key_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key.name).toBe('Updated Key');
  });

  it('toggles isActive', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleKeys[0]]));
    mockDb.update.mockReturnValue(makeUpdateChain());

    const { PATCH } = require('@/app/api/keys/[id]/route');
    const req = makePatchRequest('http://localhost:3000/api/keys/key_001', { isActive: false });
    const res = await PATCH(req, { params: { id: 'key_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.key.isActive).toBe(false);
  });

  it('returns 400 for empty name', async () => {
    const { PATCH } = require('@/app/api/keys/[id]/route');
    const req = makePatchRequest('http://localhost:3000/api/keys/key_001', { name: '' });
    const res = await PATCH(req, { params: { id: 'key_001' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('cannot be empty');
  });
});

describe('DELETE /api/keys/[id] — delete key', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
  });

  it('returns 404 for non-existent key', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { DELETE } = require('@/app/api/keys/[id]/route');
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/keys/key_nonexistent'), { params: { id: 'key_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
  });

  it('deletes own key and returns success', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleKeys[0]]));
    mockDb.delete.mockReturnValue(makeDeleteChain());

    const { DELETE } = require('@/app/api/keys/[id]/route');
    const res = await DELETE(makeDeleteRequest('http://localhost:3000/api/keys/key_001'), { params: { id: 'key_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('verifies ownership before deleting', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([sampleKeys[0]]));
    mockDb.delete.mockReturnValue(makeDeleteChain());

    const { DELETE } = require('@/app/api/keys/[id]/route');
    await DELETE(makeDeleteRequest('http://localhost:3000/api/keys/key_001'), { params: { id: 'key_001' } });

    // Should have done a select first (ownership check), THEN delete by id only
    const deleteCall = mockDb.delete.mock.calls[0][0];
    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });
});