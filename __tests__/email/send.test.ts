/**
 * Tests for the email sending and tracking module.
 */
import { sendEmail, buildDocumentEmailHtml } from "@/lib/email/send";

describe("buildDocumentEmailHtml", () => {
  it("includes the document title and type in the email body", () => {
    const html = buildDocumentEmailHtml({
      senderName: "Alice",
      documentTitle: "Employment Contract - John Doe",
      documentType: "employment_contract",
      shareUrl: "https://docuhive.vercel.app/documents/shared/abc-123",
    });

    expect(html).toContain("Employment Contract - John Doe");
    expect(html).toContain("Employment Contract"); // type label
    expect(html).toContain("Alice");
    expect(html).toContain("abc-123");
  });

  it("escapes HTML in user-provided values", () => {
    const html = buildDocumentEmailHtml({
      senderName: "<script>alert('xss')</script>",
      documentTitle: "Test & Title",
      documentType: "nda",
      shareUrl: "https://docuhive.app/share?q=' OR 1=1",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&#039;");
  });

  it("generates valid HTML with header, body, and footer", () => {
    const html = buildDocumentEmailHtml({
      senderName: "Bob",
      documentTitle: "NDA - Project X",
      documentType: "nda",
      shareUrl: "https://docuhive.app/shared/tok",
    });

    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    expect(html).toContain("View Document");
    expect(html).toContain("DocuHive");
    expect(html).toContain("AI-Powered UK Business Documents");
  });
});

describe("sendEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns error when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("not configured");
  });

  it("sends email via Resend API when configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "DocuHive <noreply@docuhive.app>";

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });
    global.fetch = mockFetch;

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Document Shared",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe("email_123");

    expect(mockFetch).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer re_test_key",
        "Content-Type": "application/json",
      },
      body: expect.stringContaining("user@example.com"),
    });
  });

  it("appends open tracking pixel when URL provided", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_456" }),
    });
    global.fetch = mockFetch;

    await sendEmail({
      to: "test@example.com",
      subject: "Test with tracking",
      html: "<p>Track me</p>",
      openTrackingUrl: "https://docuhive.app/api/email/track/123/open",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.html).toContain(
      'src="https://docuhive.app/api/email/track/123/open"'
    );
    expect(body.html).toContain("Track me");
  });

  it("handles Resend API error response gracefully", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Invalid recipient" }),
    });
    global.fetch = mockFetch;

    const result = await sendEmail({
      to: "bad-email",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid recipient");
  });

  it("uses fallback EMAIL_FROM when not configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.EMAIL_FROM;

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_789" }),
    });
    global.fetch = mockFetch;

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.from).toBe("DocuHive <noreply@docuhive.app>");
  });
});