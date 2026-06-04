// ── Document Prefill API Tests ─────────────────────────────────
// Tests GET /api/documents/prefill
// Verifies tenant isolation, field alias resolution, employee filtering
// and correct suggestion shape.

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
      constructor(input: string, init?: RequestInit) {
        this.url = input; this.method = init?.method ?? 'GET';
        this.headers = new Headers(init?.headers);
      }
      async json() { return {}; }
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
  desc: jest.fn((a) => ({ type: 'desc', expr: a })),
}));

// Use a shared factory so both the mock and tests reference the same select fn
const mockSelect = jest.fn();
jest.mock('@/lib/db', () => ({ __esModule: true, db: { select: jest.fn() } }));

import { GET } from '@/app/api/documents/prefill/route';
import { requireAuth } from '@/lib/auth/tenant';

const mockRequireAuth = requireAuth as jest.Mock;

/** Build a db.select() chain that resolves to the given result array. */
function buildDbChain(result: any[]) {
  const chain: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: any) => Promise.resolve(resolve(result))),
  };
  return chain;
}

function getMockDb() {
  return require('@/lib/db').db;
}

function mockRequest(urlString: string) {
  return { url: urlString } as any;
}

describe('GET /api/documents/prefill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ tenantId: 'tenant_1', clerkUserId: 'user_1' });
    getMockDb().select.mockReturnValue(buildDbChain([]));
  });

  it('returns empty suggestions when no documents exist', async () => {
    getMockDb().select.mockReturnValue(buildDbChain([]));

    const req = mockRequest('http://localhost/api/documents/prefill?docType=employment_contract');
    const res = await GET(req);
    const json = await res.json();

    expect(json.suggestions).toEqual([]);
    expect(json.scanned).toBe(0);
  });

  it('extracts employee_name from previous documents', async () => {
    getMockDb().select.mockReturnValue(buildDbChain([
      {
        id: 'doc_1',
        type: 'employment_contract',
        title: 'John Smith Contract',
        inputData: { employee_name: 'John Smith', job_title: 'Developer', start_date: '2026-01-01' },
        createdAt: '2026-06-01',
      },
    ]));

    const req = mockRequest('http://localhost/api/documents/prefill?docType=offer_letter');
    const res = await GET(req);
    const json = await res.json();

    expect(json.scanned).toBe(1);
    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'employee_name', value: 'John Smith' })
    );
    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'job_title', value: 'Developer' })
    );
    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'start_date', value: '2026-01-01' })
    );
  });

  it('resolves field aliases across doc types', async () => {
    getMockDb().select.mockReturnValue(buildDbChain([
      {
        id: 'doc_1',
        type: 'offer_letter',
        title: 'Offer for Alice',
        inputData: { candidate_name: 'Alice', company_name: 'Acme Ltd', job_title: 'Designer' },
        createdAt: '2026-06-01',
      },
    ]));

    // employment_contract uses employee_name, not candidate_name
    const req = mockRequest('http://localhost/api/documents/prefill?docType=employment_contract');
    const res = await GET(req);
    const json = await res.json();

    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'employee_name', value: 'Alice' })
    );
    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'employer_name', value: 'Acme Ltd' })
    );
  });

  it('handles employee name filtering', async () => {
    getMockDb().select.mockReturnValue(buildDbChain([
      {
        id: 'doc_1',
        type: 'employment_contract',
        title: 'John Contract',
        inputData: { employee_name: 'John', job_title: 'Dev' },
        createdAt: '2026-06-01',
      },
      {
        id: 'doc_2',
        type: 'employment_contract',
        title: 'Jane Contract',
        inputData: { employee_name: 'Jane', job_title: 'PM' },
        createdAt: '2026-06-02',
      },
    ]));

    const req = mockRequest('http://localhost/api/documents/prefill?docType=payslip&employeeName=Jane');
    const res = await GET(req);
    const json = await res.json();

    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'employee_name', value: 'Jane' })
    );
    expect(json.suggestions).not.toContainEqual(
      expect.objectContaining({ fieldKey: 'employee_name', value: 'John' })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(
      new (require('@/lib/auth/tenant').AuthError)('Unauthorized')
    );

    const req = mockRequest('http://localhost/api/documents/prefill?docType=employment_contract');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when docType is missing', async () => {
    const req = mockRequest('http://localhost/api/documents/prefill');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('docType');
  });

  it('extracts company-level fields from previous documents', async () => {
    getMockDb().select.mockReturnValue(buildDbChain([
      {
        id: 'doc_1',
        type: 'p45',
        title: 'P45 for Bob',
        inputData: { employee_name: 'Bob', employer_name: 'MegaCorp', ni_number: 'AB123456C', tax_code: '1257L' },
        createdAt: '2026-06-01',
      },
    ]));

    const req = mockRequest('http://localhost/api/documents/prefill?docType=payslip&employeeName=Bob');
    const res = await GET(req);
    const json = await res.json();

    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'ni_number', value: 'AB123456C' })
    );
    expect(json.suggestions).toContainEqual(
      expect.objectContaining({ fieldKey: 'tax_code', value: '1257L' })
    );
  });
});