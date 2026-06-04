// ── Document Compare API Tests ─────────────────────────────────────
// Tests the GET /api/documents/:id/compare endpoint.

jest.mock("next/server", () => {
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
      private bodyFn: (() => Promise<any>) | undefined;
      constructor(input: string, init?: RequestInit) {
        this.url = input;
        this.method = init?.method ?? "GET";
        this.headers = new Headers(init?.headers);
      }
      async json() {
        return this.bodyFn ? this.bodyFn() : {};
      }
      _setBody(fn: () => Promise<any>) {
        this.bodyFn = fn;
      }
    },
  };
});

jest.mock("@/lib/auth/tenant", () => {
  const AuthError = class AuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "AuthError";
    }
  };
  return { __esModule: true, requireAuth: jest.fn(), AuthError };
});

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((a, b) => ({ type: "eq", column: a, value: b })),
  and: jest.fn((...args) => ({ type: "and", args })),
  desc: jest.fn((a) => ({ type: "desc", expr: a })),
}));

jest.mock("@clerk/nextjs/server", () => ({
  __esModule: true,
  clerkClient: jest.fn(),
}));

const mockSelect = jest.fn();
const mockDb = {
  select: mockSelect,
  update: jest.fn(),
  insert: jest.fn(),
};
jest.mock("@/lib/db", () => ({ __esModule: true, db: mockDb }));

import { NextRequest } from "next/server";
const { requireAuth, AuthError } = require("@/lib/auth/tenant");
const mockRequireAuth = requireAuth as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────

const OWNING_TENANT = "tenant_abc";
const OTHER_TENANT = "tenant_xyz";
const DOC_ID = "doc_001";

function thenable(data: any) {
  const t: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: "Promise",
  };
  Object.defineProperty(t, "then", {
    value: jest.fn((resolve: (v: any) => any) =>
      Promise.resolve(data).then(resolve)
    ),
  });
  return t;
}

function setSelectSequence(...results: any[]) {
  const queue = [...results];
  mockSelect.mockImplementation(() => {
    const next = queue.shift() ?? thenable([]);
    return next;
  });
}

function makeGetRequest(url: string): NextRequest {
  return new (NextRequest as any)(url, {
    method: "GET",
    headers: { origin: "https://docuhive.app" },
  });
}

const sampleDoc = {
  id: DOC_ID,
  tenantId: OWNING_TENANT,
  type: "employment_contract",
  title: "Contract A",
  status: "generated",
};

const version1 = {
  id: "v001",
  documentId: DOC_ID,
  version: 1,
  outputData: { clause_1: "Original clause 1", clause_2: "Original clause 2" },
  inputData: { employee_name: "John" },
  changeType: "initial" as const,
  changeDescription: "Document generated",
  changedBy: "user_abc",
  createdAt: new Date("2026-06-01T10:00:00Z"),
};

const version2 = {
  id: "v002",
  documentId: DOC_ID,
  version: 2,
  outputData: { clause_1: "Updated clause 1", clause_2: "Original clause 2" },
  inputData: { employee_name: "John" },
  changeType: "ai_edit" as const,
  changeDescription: "Updated clause 1",
  changedBy: "user_abc",
  createdAt: new Date("2026-06-02T14:00:00Z"),
};

describe("Document Compare — GET /api/documents/:id/compare", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      clerkUserId: "user_abc",
      tenantId: OWNING_TENANT,
    });
  });

  it("returns diff between two versions", async () => {
    // DOC lookup, then v1, then v2 (3 sequential select calls)
    setSelectSequence(thenable([sampleDoc]), thenable([version1]), thenable([version2]));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=1&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.documentId).toBe(DOC_ID);
    expect(json.versions).toHaveLength(2);
    expect(json.diff).toBeDefined();
    expect(json.diff.sectionsChanged).toBe(1); // clause_1 changed
    expect(json.diff.totalChanges).toBe(1);

    const changedSection = json.diff.sections.find(
      (s: any) => s.key === "clause_1"
    );
    expect(changedSection).toBeDefined();
    expect(changedSection.status).toBe("modified");
    expect(changedSection.wordDiff).toBeDefined();
  });

  it("returns 400 when v1 or v2 query params are missing", async () => {
    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(`http://localhost:3000/api/documents/${DOC_ID}/compare`),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when comparing a version with itself", async () => {
    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=2&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid version numbers", async () => {
    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=abc&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when document not found", async () => {
    setSelectSequence(thenable([]));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=1&v2=2`
      ),
      { params: { id: "nonexistent" } }
    );
    expect(res.status).toBe(404);
  });

  it("enforces tenant isolation (other tenant gets 404)", async () => {
    setSelectSequence(thenable([{ ...sampleDoc, tenantId: OTHER_TENANT }]));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=1&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when v1 version does not exist", async () => {
    setSelectSequence(thenable([sampleDoc]), thenable([]));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=99&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when v2 version does not exist", async () => {
    setSelectSequence(
      thenable([sampleDoc]),
      thenable([version1]),
      thenable([])
    );

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=1&v2=99`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockRejectedValue(new AuthError("Unauthorized"));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=1&v2=2`
      ),
      { params: { id: DOC_ID } }
    );
    expect(res.status).toBe(401);
  });

  it("works regardless of v1/v2 ordering (v1 > v2)", async () => {
    setSelectSequence(thenable([sampleDoc]), thenable([version2]), thenable([version1]));

    const { GET } = require("@/app/api/documents/[id]/compare/route");
    const res = await GET(
      makeGetRequest(
        `http://localhost:3000/api/documents/${DOC_ID}/compare?v1=2&v2=1`
      ),
      { params: { id: DOC_ID } }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.diff.sectionsChanged).toBe(1);
    // Check that versions are still ordered older → newer in the diff
    expect(json.diff.sections[0].status).toBe("modified");
  });
});