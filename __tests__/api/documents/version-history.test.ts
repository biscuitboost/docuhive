// ── Version History Integration Tests ─────────────────────────────
// Tests the full document version lifecycle:
//   - Generate document → v1 snapshot created
//   - AI edit → v2 snapshot captured with old content preserved
//   - Manual edit → v3 snapshot created
//   - List versions returns all versions with metadata
//   - Get specific version returns full snapshot
//   - Mark version as issued
//   - Restore to previous version
//   - Tenant isolation (can't see/restore/issue other tenant's versions)
//   - Auth enforcement on all endpoints
//   - Edge cases: no versions, invalid version, draft guard

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
}));

jest.mock('@clerk/nextjs/server', () => ({ __esModule: true, clerkClient: jest.fn() }));

// Mock DB with a shift-based approach so sequential calls get different results
const mockSelect = jest.fn();

// Chainable insert returning mock for createNotification
function makeInsertChain() {
  const chain: any = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'notif_1' }]),
  };
  return chain;
}

const mockDb = {
  select: mockSelect,
  update: jest.fn(),
  insert: jest.fn(() => makeInsertChain()),
};
jest.mock('@/lib/db', () => ({ __esModule: true, db: mockDb }));

import { NextRequest } from 'next/server';
const { requireAuth, AuthError } = require('@/lib/auth/tenant');
const mockRequireAuth = requireAuth as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────

const OWNING_TENANT = 'tenant_abc';
const OTHER_TENANT = 'tenant_xyz';
const DOC_ID = 'doc_001';

// Returns a thenable object that looks like a Drizzle query builder
function thenable(data: any) {
  const t: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: 'Promise',
  };
  Object.defineProperty(t, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(data).then(resolve)),
  });
  return t;
}

function updateChain() {
  return { set: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue({ rowCount: 1 }) };
}

function insertAndReturn(result: any) {
  const t: any = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([result]),
    [Symbol.toStringTag]: 'Promise',
  };
  Object.defineProperty(t, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve([result]).then(resolve)),
  });
  return t;
}

// Set up mockSelect to return results in order for sequential calls
function setSelectSequence(...results: any[]) {
  const queue = [...results];
  mockSelect.mockImplementation(() => {
    const next = queue.shift() ?? thenable([]);
    return next;
  });
}

function makeGetRequest(url: string): NextRequest {
  return new (NextRequest as any)(url, {
    method: 'GET',
    headers: { origin: 'https://docuhive.app' },
  });
}

function makePostRequest(url: string, body: Record<string, any> = {}): NextRequest {
  const req = new (NextRequest as any)(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://docuhive.app' },
  });
  (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

const sampleDoc = {
  id: DOC_ID, tenantId: OWNING_TENANT, type: 'employment_contract', title: 'Contract A',
  status: 'generated', inputData: { employee_name: 'John' },
  outputData: { clause_1: 'Clause 1 text', clause_2: 'Clause 2 text' },
  outputUrl: null, aiModel: 'deepseek/deepseek-chat',
  version: 3, createdBy: 'user_abc', currentIssuedVersion: null,
  createdAt: new Date('2026-06-01'), updatedAt: new Date('2026-06-03'),
};

const sampleVersions = [
  { id: 'v001', documentId: DOC_ID, version: 1,
    outputData: { clause_1: 'Clause 1 text', clause_2: 'Clause 2 text' },
    inputData: { employee_name: 'John' }, changeType: 'initial',
    changeDescription: 'Document generated', changedBy: 'user_abc',
    createdAt: new Date('2026-06-01T10:00:00Z') },
  { id: 'v002', documentId: DOC_ID, version: 2,
    outputData: { clause_1: 'Updated clause 1', clause_2: 'Clause 2 text' },
    inputData: { employee_name: 'John' }, changeType: 'ai_edit',
    changeDescription: 'Update clause 1 wording', changedBy: 'user_abc',
    createdAt: new Date('2026-06-02T14:00:00Z') },
  { id: 'v003', documentId: DOC_ID, version: 3,
    outputData: { clause_1: 'Updated clause 1', clause_2: 'Updated clause 2 text' },
    inputData: { employee_name: 'John' }, changeType: 'manual_edit',
    changeDescription: 'Manual edit: clause_2', changedBy: 'user_abc',
    createdAt: new Date('2026-06-03T09:00:00Z') },
];

const issuedDoc = {
  ...sampleDoc, status: 'issued', currentIssuedVersion: 2,
};

// ── Tests ─────────────────────────────────────────────────────

describe('Version History — Full Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: OWNING_TENANT });
  });

  // ── List Versions ─────────────────────────────────────────

  describe('GET /api/documents/:id/versions — List versions', () => {
    it('returns all versions for a document', async () => {
      // First call: doc lookup, Second call: version listing
      setSelectSequence(thenable([sampleDoc]), thenable(sampleVersions));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: DOC_ID },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.versions).toHaveLength(3);
      expect(json.totalCount).toBe(3); // route does result.length on the versions array
      expect(json.versions.find((v: any) => v.version === 3)).toBeDefined();
      expect(json.versions.find((v: any) => v.version === 1)).toBeDefined();
      expect(json.versions[0].isIssued).toBe(false);
    });

    it('includes isIssued flag for the issued version', async () => {
      setSelectSequence(thenable([issuedDoc]), thenable(sampleVersions));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: DOC_ID },
      });
      const json = await res.json();

      expect(json.versions[1].version).toBe(2);
      expect(json.versions[1].isIssued).toBe(true);
    });

    it('returns empty array when no versions exist', async () => {
      setSelectSequence(thenable([sampleDoc]), thenable([]));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: DOC_ID },
      });
      const json = await res.json();

      expect(json.versions).toHaveLength(0);
      expect(json.totalCount).toBe(0);
    });

    it('returns 404 for non-existent document', async () => {
      setSelectSequence(thenable([]));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: 'nonexistent' },
      });
      expect(res.status).toBe(404);
    });

    it('enforces tenant isolation (other tenant gets 404)', async () => {
      setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: DOC_ID },
      });
      expect(res.status).toBe(404);
    });

    it('returns 401 when not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new AuthError('Unauthorized'));

      const { GET } = require('@/app/api/documents/[id]/versions/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions`), {
        params: { id: DOC_ID },
      });
      expect(res.status).toBe(401);
    });
  });

  // ── Get Specific Version ──────────────────────────────────

  describe('GET /api/documents/:id/versions/:version — Get specific version', () => {
    it('returns the full snapshot of a specific version', async () => {
      setSelectSequence(thenable([sampleDoc]), thenable([sampleVersions[0]]));

      const { GET } = require('@/app/api/documents/[id]/versions/[version]/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/1`), {
        params: { id: DOC_ID, version: '1' },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.version).toBe(1);
      expect(json.outputData).toEqual({ clause_1: 'Clause 1 text', clause_2: 'Clause 2 text' });
      expect(json.changeType).toBe('initial');
      expect(json.changeDescription).toBe('Document generated');
      expect(json.isIssued).toBe(false);
    });

    it('returns 400 for invalid version number', async () => {
      const { GET } = require('@/app/api/documents/[id]/versions/[version]/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/abc`), {
        params: { id: DOC_ID, version: 'abc' },
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent version', async () => {
      setSelectSequence(thenable([sampleDoc]), thenable([]));

      const { GET } = require('@/app/api/documents/[id]/versions/[version]/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/99`), {
        params: { id: DOC_ID, version: '99' },
      });
      expect(res.status).toBe(404);
    });

    it('enforces tenant isolation', async () => {
      setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

      const { GET } = require('@/app/api/documents/[id]/versions/[version]/route');
      const res = await GET(makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/1`), {
        params: { id: DOC_ID, version: '1' },
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Issue Version ─────────────────────────────────────────

  describe('POST /api/documents/:id/versions/:version/issue — Mark as issued', () => {
    it('marks a version as issued and updates document status', async () => {
      // DOC lookup → version lookup
      setSelectSequence(
        thenable([{ ...sampleDoc, currentIssuedVersion: null }]),
        thenable([sampleVersions[1]])
      );
      mockDb.update.mockReturnValue(updateChain());

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/issue/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/2/issue`), {
        params: { id: DOC_ID, version: '2' },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.issuedVersion).toBe(2);
      expect(json.issuedAt).toBeDefined();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('returns 400 for invalid version number', async () => {
      const { POST } = require('@/app/api/documents/[id]/versions/[version]/issue/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/abc/issue`), {
        params: { id: DOC_ID, version: 'abc' },
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent version', async () => {
      setSelectSequence(thenable([sampleDoc]), thenable([]));

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/issue/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/99/issue`), {
        params: { id: DOC_ID, version: '99' },
      });
      expect(res.status).toBe(404);
    });

    it('enforces tenant isolation — other tenant gets 404', async () => {
      setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/issue/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/1/issue`), {
        params: { id: DOC_ID, version: '1' },
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Restore Version ───────────────────────────────────────

  describe('POST /api/documents/:id/versions/:version/restore — Restore to previous version', () => {
    it('restores document to a previous version (creates new version)', async () => {
      // DOC lookup → target version lookup
      setSelectSequence(
        thenable([{ ...sampleDoc, version: 3 }]),
        thenable([sampleVersions[0]])
      );
      mockDb.insert.mockReturnValue(insertAndReturn({ id: 'v004', version: 4 }));
      mockDb.update.mockReturnValue(updateChain());

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/restore/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/1/restore`), {
        params: { id: DOC_ID, version: '1' },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.newVersion).toBe(4);
      expect(json.content).toEqual(sampleVersions[0].outputData);
      // Should have called insert for version snapshot of current state
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('returns 404 for non-existent target version', async () => {
      setSelectSequence(thenable([sampleDoc]), thenable([]));

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/restore/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/99/restore`), {
        params: { id: DOC_ID, version: '99' },
      });
      expect(res.status).toBe(404);
    });

    it('enforces tenant isolation', async () => {
      setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

      const { POST } = require('@/app/api/documents/[id]/versions/[version]/restore/route');
      const res = await POST(makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/versions/1/restore`), {
        params: { id: DOC_ID, version: '1' },
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Manual Section Edit ───────────────────────────────────

  describe('POST /api/documents/:id/sections/:sectionKey — Manual section edit', () => {
    const editRoutePath = '@/app/api/documents/[id]/sections/[sectionKey]/route';

    it('edits a specific section and creates a new version', async () => {
      const mockDoc = {
        ...sampleDoc,
        version: 2,
        outputData: { clause_1: 'Old clause 1', clause_2: 'Clause 2 text' },
      };
      setSelectSequence(thenable([mockDoc]));
      mockDb.insert.mockReturnValue(insertAndReturn({ id: 'v003', version: 3 }));
      mockDb.update.mockReturnValue(updateChain());

      const { POST } = require(editRoutePath);
      const res = await POST(
        makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/sections/clause_1`, { content: 'New clause 1 text' }),
        { params: { id: DOC_ID, sectionKey: 'clause_1' } }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.version).toBe(3);
      expect(json.content.clause_1).toBe('New clause 1 text');
      expect(json.content.clause_2).toBe('Clause 2 text'); // Unchanged
    });

    it('returns 400 for missing content field', async () => {
      const { POST } = require(editRoutePath);
      const res = await POST(
        makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/sections/clause_1`, {}),
        { params: { id: DOC_ID, sectionKey: 'clause_1' } }
      );
      expect(res.status).toBe(400);
    });

    it('blocks editing draft documents', async () => {
      const draftDoc = { ...sampleDoc, status: 'draft', outputData: null };
      setSelectSequence(thenable([draftDoc]));

      const { POST } = require(editRoutePath);
      const res = await POST(
        makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/sections/clause_1`, { content: 'New text' }),
        { params: { id: DOC_ID, sectionKey: 'clause_1' } }
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain('Only generated documents');
    });

    it('enforces tenant isolation', async () => {
      setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

      const { POST } = require(editRoutePath);
      const res = await POST(
        makePostRequest(`http://localhost:3000/api/documents/${DOC_ID}/sections/clause_1`, { content: 'New text' }),
        { params: { id: DOC_ID, sectionKey: 'clause_1' } }
      );
      expect(res.status).toBe(404);
    });
  });

  // ── Document Detail exposes currentIssuedVersion ──────────

  describe('GET /api/documents/:id — Detail returns currentIssuedVersion', () => {
    it('includes currentIssuedVersion in response', async () => {
      setSelectSequence(thenable([issuedDoc]));

      const { GET } = require('@/app/api/documents/[id]/route');
      const req = makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}`);
      const res = await GET(req, { params: { id: DOC_ID } });
      const json = await res.json();

      expect(json.currentIssuedVersion).toBe(2);
      expect(json.status).toBe('issued');
    });

    it('returns null for currentIssuedVersion when none is set', async () => {
      setSelectSequence(thenable([sampleDoc]));

      const { GET } = require('@/app/api/documents/[id]/route');
      const req = makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}`);
      const res = await GET(req, { params: { id: DOC_ID } });
      const json = await res.json();

      expect(json.currentIssuedVersion).toBeNull();
    });
  });
});