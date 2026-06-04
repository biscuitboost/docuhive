/**
 * Email sending module for DocuHive.
 * Uses Resend's REST API directly (no SDK dependency).
 * Supports sending document share links via email with click tracking.
 */

const RESEND_API_URL = "https://api.resend.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Optional open-tracking pixel — specify a callback URL that will be hit when the email is opened */
  openTrackingUrl?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend REST API.
 * Falls back gracefully if RESEND_API_KEY is not configured.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured — email would have been sent to:", params.to);
    return { success: false, error: "Email service not configured" };
  }

  const fromAddress = process.env.EMAIL_FROM || "DocuHive <noreply@docuhive.app>";

  // Inject open tracking pixel if URL provided
  let html = params.html;
  if (params.openTrackingUrl) {
    html += `\n<img src="${params.openTrackingUrl}" width="1" height="1" alt="" style="display:none" />`;
  }

  try {
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[email] Resend API error:", res.status, data);
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    return { success: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[email] Failed to send:", message);
    return { success: false, error: message };
  }
}

/**
 * Build the HTML email body for a shared document notification.
 */
export function buildDocumentEmailHtml(params: {
  senderName: string;
  documentTitle: string;
  documentType: string;
  shareUrl: string;
}): string {
  const typeLabel = params.documentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">&#x2728; DocuHive</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">AI-Powered UK Business Documents</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:600;">Document Shared With You</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                ${escapeHtml(params.senderName)} has shared a document with you via DocuHive.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Document</p>
                    <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">${escapeHtml(params.documentTitle)}</p>
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Type</p>
                    <p style="margin:0;color:#111827;font-size:14px;">${escapeHtml(typeLabel)}</p>
                  </td>
                </tr>
              </table>

              <a href="${escapeHtml(params.shareUrl)}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">
                View Document
              </a>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
                This link is unique to you. Don't forward it — if you believe this was sent in error,
                please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Powered by DocuHive &mdash; AI-Generated UK Employment &amp; Business Documents
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Simple HTML escaping to prevent injection in email bodies.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}