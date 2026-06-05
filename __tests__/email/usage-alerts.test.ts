/**
 * Tests for usage-based trial expiry email alerts.
 */
import {
  USAGE_ALERTS,
  processUsageAlerts,
  processUsageAlertForThreshold,
} from "@/lib/email/usage-alerts";
import { emailDripTracking } from "@/lib/db/schema";

// ── Mocks ─────────────────────────────────────────────────────
// NOTE: jest.mock factories are hoisted — use jest.fn() inline,
// don't reference outer variables.

jest.mock("@/lib/db", () => {
  const mSelect = jest.fn();
  const mInsert = jest.fn(() => ({
    values: jest.fn().mockResolvedValue(undefined),
  }));
  return {
    __esModule: true,
    db: { select: mSelect, insert: mInsert },
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

// ── Helpers ─────────────────────────────────────────────────

function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: "Promise",
  };
  Object.defineProperty(q, "then", {
    value: jest.fn((resolve: (v: any) => any) => {
      return Promise.resolve(result).then(resolve);
    }),
  });
  return q;
}

// ── Tests ──────────────────────────────────────────────────────

describe("USAGE_ALERTS", () => {
  it("has 3 alert thresholds", () => {
    expect(USAGE_ALERTS).toHaveLength(3);
  });

  it("has thresholds 5, 8, 9 in ascending order", () => {
    const thresholds = USAGE_ALERTS.map((a) => a.threshold);
    expect(thresholds).toEqual([5, 8, 9]);
  });

  it("all email types are unique", () => {
    const types = USAGE_ALERTS.map((a) => a.emailType);
    expect(new Set(types).size).toBe(types.length);
  });

  it("each buildHtml returns valid HTML with a CTA link", () => {
    for (const alert of USAGE_ALERTS) {
      const html = alert.buildHtml({
        tenantName: "Alice",
        companyName: "Acme Ltd",
        docsUsed: alert.threshold,
        docsRemaining: 10 - alert.threshold,
      });
      expect(html).toContain("docuhive.app");
      expect(html).toContain("</html>");
      expect(html).toContain("Alice");
      expect(html).toContain(`${alert.threshold}`);
    }
  });

  it("escapes HTML in user-provided tenant names", () => {
    for (const alert of USAGE_ALERTS) {
      const html = alert.buildHtml({
        tenantName: "<script>alert('xss')</script>",
        companyName: 'Test & Co "Ltd"',
        docsUsed: alert.threshold,
        docsRemaining: 10 - alert.threshold,
      });
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&amp;");
    }
  });

  it("handles missing companyName gracefully", () => {
    for (const alert of USAGE_ALERTS) {
      const html = alert.buildHtml({
        tenantName: "Bob",
        companyName: "",
        docsUsed: alert.threshold,
        docsRemaining: 10 - alert.threshold,
      });
      expect(html).toContain("Bob");
      expect(html).not.toContain("null");
      expect(html).not.toContain("undefined");
    }
  });

  it("shows remaining count in the email body", () => {
    const alert = USAGE_ALERTS[0];
    const html = alert.buildHtml({
      tenantName: "Charlie",
      companyName: "",
      docsUsed: 5,
      docsRemaining: 5,
    });
    expect(html).toContain("5 of");
    expect(html).toContain("10");
  });

  it("all subjects are non-empty strings", () => {
    for (const alert of USAGE_ALERTS) {
      expect(alert.subject).toBeTruthy();
      expect(typeof alert.subject).toBe("string");
    }
  });
});

describe("processUsageAlerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zero counts when no essentials tenants exist", async () => {
    const { db } = require("@/lib/db");
    db.select.mockReturnValue(makeThenableSelect([]));

    const result = await processUsageAlerts();
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("does not send alert if doc count is below threshold", async () => {
    const { db } = require("@/lib/db");

    db.select.mockReturnValueOnce(
      makeThenableSelect([
        { id: "tenant_01", name: "Alice's Company", companyName: "Acme Ltd" },
      ])
    );
    db.select.mockReturnValueOnce(makeThenableSelect([{ count: 2 }]));

    const result = await processUsageAlerts();
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
  });

  it("sends alert when doc count meets threshold", async () => {
    const { db } = require("@/lib/db");
    const { sendEmail } = require("@/lib/email/send");

    db.select.mockReturnValueOnce(
      makeThenableSelect([
        { id: "tenant_01", name: "Alice's Company", companyName: "Acme Ltd" },
      ])
    );
    db.select.mockReturnValueOnce(makeThenableSelect([{ count: 5 }]));
    db.select.mockReturnValueOnce(makeThenableSelect([]));
    db.select.mockReturnValueOnce(makeThenableSelect([{ clerkUserId: "user_abc" }]));

    const result = await processUsageAlerts();
    expect(result.sent).toBe(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("5 of 10"),
      })
    );
  });

  it("does not re-send same alert within same month", async () => {
    const { db } = require("@/lib/db");

    db.select.mockReturnValueOnce(
      makeThenableSelect([
        { id: "tenant_01", name: "Alice's Company", companyName: "Acme Ltd" },
      ])
    );
    db.select.mockReturnValueOnce(makeThenableSelect([{ count: 5 }]));
    db.select.mockReturnValueOnce(
      makeThenableSelect([{ id: "existing_alert_id" }])
    );

    const result = await processUsageAlerts();
    expect(result.sent).toBe(0);
  });

  it("skips tenant when no owner email is found", async () => {
    const { db } = require("@/lib/db");

    db.select.mockReturnValueOnce(
      makeThenableSelect([
        { id: "tenant_01", name: "Alice's Company", companyName: "Acme Ltd" },
      ])
    );
    db.select.mockReturnValueOnce(makeThenableSelect([{ count: 5 }]));
    db.select.mockReturnValueOnce(makeThenableSelect([]));
    db.select.mockReturnValueOnce(makeThenableSelect([]));

    const result = await processUsageAlerts();
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });
});

describe("processUsageAlertForThreshold", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zero counts for unknown threshold", async () => {
    const result = await processUsageAlertForThreshold(99);
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });

  it("returns zero counts when no essentials tenants exist", async () => {
    const { db } = require("@/lib/db");
    db.select.mockReturnValue(makeThenableSelect([]));

    const result = await processUsageAlertForThreshold(5);
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });
});

describe("emailDripTracking schema reference", () => {
  it("has the correct table reference for usage alerts", () => {
    expect(emailDripTracking).toBeDefined();
    expect(emailDripTracking.tenantId).toBeDefined();
  });
});