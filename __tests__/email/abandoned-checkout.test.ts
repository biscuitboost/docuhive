/**
 * Tests for abandoned checkout email functionality.
 */
import {
  buildAbandonedCheckoutHtml,
  sendAbandonedCheckoutEmail,
} from "@/lib/email/abandoned-checkout";

// ── Mocks ─────────────────────────────────────────────────────

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
        emailAddresses: [{ emailAddress: "admin@example.com" }],
      }),
    },
  })),
}));

jest.mock("@/lib/stripe/pricing", () => ({
  PLANS: {
    essentials: { id: "essentials", name: "Essentials", price: 49, docsLimit: 10, multiUser: false },
    pro: { id: "pro", name: "Pro", price: 79, docsLimit: null, multiUser: false },
    team: { id: "team", name: "Team", price: 99, docsLimit: null, multiUser: true },
  },
  getPlanByPriceId: jest.fn(),
  formatPlanPrice: jest.fn(),
}));

// ── Helpers ─────────────────────────────────────────────────

/**
 * Create a thenable mock query result that resolves to the given array.
 * Each method (.from, .where, .limit) returns `this` so chaining works.
 */
function makeThenableSelect(result: any[]) {
  const q: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    [Symbol.toStringTag]: "Promise",
  };
  Object.defineProperty(q, "then", {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(result).then(resolve)),
    writable: true,
    configurable: true,
  });
  return q;
}

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

const mockDbSelect = db.select as jest.Mock;
const mockDbInsert = db.insert as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

describe("buildAbandonedCheckoutHtml", () => {
  it("includes tenant name and plan name in the HTML", () => {
    const html = buildAbandonedCheckoutHtml({
      tenantName: "Alice",
      companyName: "Acme Ltd",
      planName: "Pro",
      planPrice: 79,
    });

    expect(html).toContain("Alice");
    expect(html).toContain("Acme Ltd");
    expect(html).toContain("Pro");
    expect(html).toContain("£79");
    expect(html).toContain("Resume Your Pro Checkout");
  });

  it("handles missing company name gracefully", () => {
    const html = buildAbandonedCheckoutHtml({
      tenantName: "Bob",
      companyName: "",
      planName: "Team",
      planPrice: 99,
    });

    expect(html).toContain("Bob");
    expect(html).toContain("Team");
    expect(html).toContain("£99");
  });
});

describe("sendAbandonedCheckoutEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, id: "email_mock" });
  });

  it("returns sent:true on success", async () => {
    // Call order in sendAbandonedCheckoutEmail:
    //   1. hasBeenSent            → db.select (emailDripTracking) → return [] (not sent)
    //   2. getTenantInfo          → db.select (tenants)          → return tenant data
    //   3. getTenantEmail         → db.select (tenantMembers)    → return clerkUserId
    mockDbSelect
      .mockReturnValueOnce(makeThenableSelect([]))                          // hasBeenSent
      .mockReturnValueOnce(makeThenableSelect([{ name: "Alice's Company", companyName: "Acme Ltd" }])) // tenant info
      .mockReturnValueOnce(makeThenableSelect([{ clerkUserId: "user_abc" }])); // member lookup

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "tenant_xyz",
      plan: "pro",
      sessionId: "cs_test_123",
    });

    expect(result.sent).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        subject: expect.stringContaining("Pro"),
      })
    );
  });

  it("deduplicates — returns sent:false if already sent for session", async () => {
    // hasBeenSent returns a record → existing.length > 0 → already sent
    mockDbSelect.mockReturnValueOnce(makeThenableSelect([{ id: "existing_1" }]));

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "tenant_xyz",
      plan: "pro",
      sessionId: "cs_test_123",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Already sent");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns sent:false if tenant not found", async () => {
    // hasBeenSent → [] (not sent), getTenantInfo → [] (tenant not found)
    mockDbSelect
      .mockReturnValueOnce(makeThenableSelect([]))   // hasBeenSent
      .mockReturnValueOnce(makeThenableSelect([]));  // tenant info → empty

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "nonexistent",
      plan: "pro",
      sessionId: "cs_test_123",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Tenant not found");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns sent:false if email sending fails", async () => {
    mockDbSelect
      .mockReturnValueOnce(makeThenableSelect([]))                          // hasBeenSent
      .mockReturnValueOnce(makeThenableSelect([{ name: "Bob", companyName: "Bob Ltd" }])) // tenant info
      .mockReturnValueOnce(makeThenableSelect([{ clerkUserId: "user_abc" }])); // member lookup

    mockSendEmail.mockResolvedValue({ success: false, error: "Resend API error" });

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "tenant_xyz",
      plan: "pro",
      sessionId: "cs_test_456",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Resend API error");
  });

  it("tracks the send in email_drip_tracking on success", async () => {
    mockDbSelect
      .mockReturnValueOnce(makeThenableSelect([]))                          // hasBeenSent
      .mockReturnValueOnce(makeThenableSelect([{ name: "Charlie", companyName: "Charlie Co" }])) // tenant info
      .mockReturnValueOnce(makeThenableSelect([{ clerkUserId: "user_abc" }])); // member lookup

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "tenant_charlie",
      plan: "team",
      sessionId: "cs_unique_789",
    });

    expect(result.sent).toBe(true);

    // Should have inserted a drip tracking record
    expect(mockDbInsert).toHaveBeenCalledTimes(1);
    const vals = mockDbInsert.mock.results[0]?.value?.values;
    expect(vals).toHaveBeenCalledWith({
      tenantId: "tenant_charlie",
      emailType: "abandoned_checkout_cs_unique_789",
    });
  });

  it("handles unknown plan gracefully — no DB calls", async () => {
    // Plan validation happens before any DB calls, so no mocks needed

    const result = await sendAbandonedCheckoutEmail({
      tenantId: "tenant_dave",
      plan: "nonexistent_plan",
      sessionId: "cs_test_999",
    });

    expect(result.sent).toBe(false);
    expect(result.error).toContain("Unknown plan");
    expect(mockDbSelect).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});