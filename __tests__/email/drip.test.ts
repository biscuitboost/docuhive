/**
 * Tests for the onboarding email drip sequence.
 */
import {
  DRIP_SEQUENCE,
  sendDripEmailsForDay,
  runDripSequence,
} from "@/lib/email/drip";
import { emailDripTracking } from "@/lib/db/schema";

// ── Mocks (jest.mock is hoisted — use inline jest.fn() only) ──

jest.mock("@/lib/db", () => {
  const mSelect = jest.fn();
  return {
    __esModule: true,
    db: { select: mSelect, insert: jest.fn() },
  };
});

jest.mock("@/lib/email/send", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, id: "email_mock" }),
}));

jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
    },
  })),
}));

// ── Helpers ─────────────────────────────────────────────────────

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: 'Promise',
  };
  Object.defineProperty(q, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
  });
  return q;
}

// ── Tests ──────────────────────────────────────────────────────────

describe("DRIP_SEQUENCE", () => {
  it("has 5 email types", () => {
    expect(DRIP_SEQUENCE).toHaveLength(5);
  });

  it("has days in ascending order", () => {
    const days = DRIP_SEQUENCE.map((e) => e.day);
    for (let i = 1; i < days.length; i++) {
      expect(days[i]).toBeGreaterThan(days[i - 1]);
    }
  });

  it("covers days 1, 3, 7, 10, 14 exactly", () => {
    const days = DRIP_SEQUENCE.map((e) => e.day);
    expect(days).toEqual([1, 3, 7, 10, 14]);
  });

  it("all email types are unique", () => {
    const types = DRIP_SEQUENCE.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("each buildHtml returns valid HTML with a CTA link", () => {
    for (const email of DRIP_SEQUENCE) {
      const html = email.buildHtml({
        tenantName: "Alice",
        companyName: "Acme Ltd",
      });
      expect(html).toContain("docuhive.app");
      expect(html).toContain("</html>");
      expect(html).toContain("Alice");
    }
  });

  it("escapes HTML in user-provided tenant names", () => {
    for (const email of DRIP_SEQUENCE) {
      const html = email.buildHtml({
        tenantName: "<script>alert('xss')</script>",
        companyName: 'Test & Co "Ltd"',
      });
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&amp;");
    }
  });

  it("handles missing companyName gracefully", () => {
    for (const email of DRIP_SEQUENCE) {
      const html = email.buildHtml({
        tenantName: "Bob",
        companyName: "",
      });
      expect(html).toContain("Bob");
      expect(html).not.toContain("null");
      expect(html).not.toContain("undefined");
    }
  });

  it("all subjects are non-empty strings", () => {
    for (const email of DRIP_SEQUENCE) {
      expect(email.subject).toBeTruthy();
      expect(typeof email.subject).toBe("string");
    }
  });
});

describe("sendDripEmailsForDay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zero counts for unknown day", async () => {
    const result = await sendDripEmailsForDay(99);
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });

  it("returns zero counts when no eligible tenants (empty DB query)", async () => {
    const { db } = require("@/lib/db");
    db.select.mockReturnValue(makeThenableSelect([]));

    const result = await sendDripEmailsForDay(1);
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });

  it("returns skipped when tenant has no owner email", async () => {
    const { db } = require("@/lib/db");

    // First call: select from tenants returns a tenant
    db.select.mockReturnValueOnce(
      makeThenableSelect([
        { id: "tenant_01", name: "Alice's Company", companyName: "Acme Ltd" },
      ])
    );
    // Second call: select from tenantMembers returns nothing (no owner/admin)
    db.select.mockReturnValueOnce(makeThenableSelect([]));

    const result = await sendDripEmailsForDay(1);
    expect(result).toEqual({ sent: 0, skipped: 1, errors: 0 });
  });
});

describe("runDripSequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns results for all 5 email types", async () => {
    const { db } = require("@/lib/db");
    db.select.mockReturnValue(makeThenableSelect([]));

    const results = await runDripSequence();
    expect(Object.keys(results)).toHaveLength(5);
    expect(results).toHaveProperty("onboarding_welcome");
    expect(results).toHaveProperty("onboarding_tool_spotlight");
    expect(results).toHaveProperty("onboarding_smart_features");
    expect(results).toHaveProperty("onboarding_social_proof");
    expect(results).toHaveProperty("onboarding_trial_expiry");
  });
});

describe("emailDripTracking schema", () => {
  it("has the correct table reference", () => {
    expect(emailDripTracking).toBeDefined();
    expect(emailDripTracking.tenantId).toBeDefined();
    expect(emailDripTracking.emailType).toBeDefined();
    expect(emailDripTracking.sentAt).toBeDefined();
  });
});