// ── Document Regeneration Tests ────────────────────────────────
// Tests POST /api/documents/:id/regenerate endpoint.
// Verifies tenant isolation, status gating, version snapshotting,
// and successful regeneration flow.

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
}));

const mockDb = { select: jest.fn(), update: jest.fn(), insert: jest.fn(), delete: jest.fn() };
jest.mock('@/lib/db', () => ({ __esModule: true, db: mockDb }));

jest.mock('@/lib/ai/client', () => ({
  __esModule: true,
  generateDocument: jest.fn(),
}));

jest.mock('@/lib/ai/prompts', () => ({
  __esModule: true,
  buildPrompt: jest.fn(),
}));

jest.mock('@/lib/ai/models', () => ({
  __esModule: true,
  getModelForDocType: jest.fn(() => 'deepseek/deepseek-chat'),
}));

jest.mock('@/lib/documents/versions', () => ({
  __esModule: true,
  createVersionSnapshot: jest.fn(),
}));

jest.mock('@/lib/documents/notifications', () => ({
  __esModule: true,
  createNotification: jest.fn(),
}));

jest.mock('@clerk/nextjs/server', () => ({
  __esModule: true,
  clerkClient: jest.fn(),
}));

import { requireAuth } from '@/lib/auth/tenant';
import { generateDocument as aiGenerate } from '@/lib/ai/client';
import { buildPrompt } from '@/lib/ai/prompts';

const mockRequireAuth = requireAuth as jest.Mock;
const mockAiGenerate = aiGenerate as jest.Mock;
const mockBuildPrompt = buildPrompt as jest.Mock;

function makeThenableSelect(result: any[]) {
  const q: any = { from: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis() };
  q[Symbol.toStringTag] = 'Promise';
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

function makeUpdateChain() {
  return { set: jest.fn().mockReturnThis(), where: jest.fn().mockResolvedValue({ rowCount: 1 }) };
}

function makeRequest(method: string, url: string, body?: any) {
  const { NextRequest } = require('next/server');
  const req = new (NextRequest as any)(url, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://docuhive.app' },
  });
  if (body) (req as any)._setBody(() => Promise.resolve(body));
  return req;
}

const generatedDoc = {
  id: 'doc_001', tenantId: 'tenant_xyz', type: 'employment_contract', title: 'Contract A',
  status: 'generated', inputData: { employee_name: 'Alice', job_title: 'Engineer' },
  outputData: { clause_1: 'Some content' }, version: 2, aiModel: 'deepseek/deepseek-chat',
  createdBy: 'user_abc',
};

const draftDoc = { ...generatedDoc, id: 'doc_draft', status: 'draft', outputData: null };

describe('POST /api/documents/:id/regenerate — Regenerate Document', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ clerkUserId: 'user_abc', tenantId: 'tenant_xyz' });
    mockBuildPrompt.mockReturnValue({ prompt: 'Generated prompt', system: 'System prompt' });
    mockAiGenerate.mockResolvedValue({
      content: { clause_1: 'Regenerated content', clause_2: 'New clause' },
      model: 'deepseek/deepseek-chat',
    });
  });

  it('regenerates a generated document with new inputs', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([generatedDoc]));
    mockDb.update.mockReturnValue(makeUpdateChain());
    mockDb.delete.mockReturnValue({ where: jest.fn().mockResolvedValue({}) });

    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_001/regenerate', {
      userInputs: { employee_name: 'Bob', job_title: 'Senior Engineer' },
    }), { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.documentId).toBe('doc_001');
    expect(json.version).toBe(3); // version + 1
    expect(json.content.clause_1).toBe('Regenerated content');

    // Should have created a version snapshot before regenerating
    const { createVersionSnapshot } = require('@/lib/documents/versions');
    expect(createVersionSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ changeType: 'regenerate', documentId: 'doc_001' })
    );
  });

  it('returns 400 when userInputs is missing', async () => {
    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_001/regenerate', {}), { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Missing');
  });

  it('returns 404 for non-existent document', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([]));

    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_nonexistent/regenerate', { userInputs: { x: 'y' } }), { params: { id: 'doc_nonexistent' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('not found');
  });

  it('returns 404 for document owned by another tenant', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([{ ...generatedDoc, tenantId: 'tenant_other' }]));

    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_001/regenerate', { userInputs: { x: 'y' } }), { params: { id: 'doc_001' } });

    expect(res.status).toBe(404);
  });

  it('rejects draft documents', async () => {
    mockDb.select.mockReturnValue(makeThenableSelect([draftDoc]));

    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_draft/regenerate', { userInputs: { x: 'y' } }), { params: { id: 'doc_draft' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Only generated');
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new (require('@/lib/auth/tenant').AuthError)('Unauthorized'));

    const { POST } = require('@/app/api/documents/[id]/regenerate/route');
    const res = await POST(makeRequest('POST', 'http://localhost:3000/api/documents/doc_001/regenerate', { userInputs: { x: 'y' } }), { params: { id: 'doc_001' } });
    const json = await res.json();

    expect(res.status).toBe(401);
  });
});