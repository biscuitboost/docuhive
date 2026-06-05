/**
 * Abandoned checkout email for DocuHive.
 * Sent when a Stripe checkout session expires without completion.
 * Triggered by the checkout.session.expired webhook event.
 *
 * Strategy: The webhook handler calls sendAbandonedCheckoutEmail().
 * We track sends via email_drip_tracking with a session-specific emailType
 * (abandoned_checkout_{sessionId}) to prevent duplicate sends.
 */

import { db } from "@/lib/db";
import { tenants, tenantMembers, emailDripTracking } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { sendEmail } from "./send";
import { PLANS, type PlanId } from "@/lib/stripe/pricing";

// ── Constants ────────────────────────────────────────────────────────

const EMAIL_TYPE_PREFIX = "abandoned_checkout_";

// ── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailLayout(params: {
  title: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  secondaryText?: string;
}): string {
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
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${escapeHtml(params.title)}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">AI-Powered UK Business Documents</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:600;">${escapeHtml(params.headline)}</h2>
              ${params.body}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:8px;">
                    <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(params.ctaText)}</a>
                  </td>
                </tr>
              </table>
              ${params.secondaryText ? `<p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">${params.secondaryText}</p>` : ""}
            </td>
          </tr>
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

// ── Email Templates ──────────────────────────────────────────────────

export function buildAbandonedCheckoutHtml(params: {
  tenantName: string;
  companyName: string;
  planName: string;
  planPrice: number;
}): string {
  return buildEmailLayout({
    title: "DocuHive",
    headline: `You Left Something Behind, ${params.tenantName}`,
    body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      We noticed you started signing up for the <strong style="color:#111827;">${escapeHtml(params.planName)} (£${params.planPrice}/mo)</strong> plan
      ${params.companyName ? `for ${escapeHtml(params.companyName)}` : ""} but didn't complete the checkout.
    </p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Here's what you get with <strong style="color:#111827;">${escapeHtml(params.planName)}</strong>:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
      <li>Unlimited AI-generated UK business documents</li>
      <li>26 document types (employment, contracts, data protection)</li>
      <li>Custom branding on all documents</li>
      <li>Priority AI models for better quality output</li>
      <li>PDF &amp; Word downloads</li>
      <li>Email sharing with open tracking</li>
      <li>Legislative auto-updates to stay compliant</li>
    </ul>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      <strong style="color:#111827;">Still on the fence?</strong> Your Essentials plan is still active —
      you can keep using DocuHive. Upgrade whenever you're ready.
    </p>`,
    ctaText: `Resume Your ${escapeHtml(params.planName)} Checkout`,
    ctaUrl: "https://docuhive.app/pricing",
    secondaryText: "Your checkout link has expired — but you can start a new one anytime from the pricing page.",
  });
}

// ── Sending Logic ────────────────────────────────────────────────────

/**
 * Get the email address for a tenant's owner/admin user via Clerk API.
 */
async function getTenantEmail(tenantId: string): Promise<string | null> {
  try {
    const member = await db
      .select({ clerkUserId: tenantMembers.clerkUserId })
      .from(tenantMembers)
      .where(
        and(
          eq(tenantMembers.tenantId, tenantId),
          inArray(tenantMembers.role, ["owner", "admin"])
        )
      )
      .limit(1);

    if (member.length === 0) return null;

    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = clerkClient();
    const clerkUser = await clerk.users.getUser(member[0].clerkUserId);
    return clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    console.warn(`[abandoned-checkout] Could not resolve email for tenant ${tenantId}`);
    return null;
  }
}

/**
 * Check if an abandoned checkout email has already been sent for this session.
 */
async function hasBeenSent(tenantId: string, sessionId: string): Promise<boolean> {
  const existing = await db
    .select({ id: emailDripTracking.id })
    .from(emailDripTracking)
    .where(
      and(
        eq(emailDripTracking.tenantId, tenantId),
        eq(emailDripTracking.emailType, `${EMAIL_TYPE_PREFIX}${sessionId}`)
      )
    )
    .limit(1);
  return existing.length > 0;
}

/**
 * Send an abandoned checkout email for an expired session.
 * Called by the webhook handler when checkout.session.expired fires.
 *
 * Returns { sent: true } on success, or { sent: false, error } on failure.
 */
export async function sendAbandonedCheckoutEmail(params: {
  tenantId: string;
  plan: string;
  sessionId: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { tenantId, plan, sessionId } = params;

  // 0. Validate plan early — fail fast
  const planConfig = PLANS[plan as PlanId];
  if (!planConfig) {
    return { sent: false, error: `Unknown plan: ${plan}` };
  }

  // 1. Deduplicate — check if already sent for this session
  const alreadySent = await hasBeenSent(tenantId, sessionId);
  if (alreadySent) {
    return { sent: false, error: "Already sent for this session" };
  }

  // 2. Get tenant info
  const tenantInfo = await db
    .select({
      name: tenants.name,
      companyName: tenants.companyName,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantInfo.length === 0) {
    return { sent: false, error: "Tenant not found" };
  }

  // 3. Resolve email via Clerk
  const email = await getTenantEmail(tenantId);
  if (!email) {
    return { sent: false, error: "No email address found for tenant owner/admin" };
  }

  // 4. Send the email
  try {
    const html = buildAbandonedCheckoutHtml({
      tenantName: tenantInfo[0].name.replace(/'s Company$/, ""),
      companyName: tenantInfo[0].companyName ?? "",
      planName: planConfig.name,
      planPrice: planConfig.price,
    });

    const result = await sendEmail({
      to: email,
      subject: `Don't Miss Out — Complete Your ${planConfig.name} Signup`,
      html,
    });

    if (result.success) {
      // Track this send
      await db.insert(emailDripTracking).values({
        tenantId,
        emailType: `${EMAIL_TYPE_PREFIX}${sessionId}`,
      });
      return { sent: true };
    }

    return { sent: false, error: result.error };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[abandoned-checkout] Failed to send:", message);
    return { sent: false, error: message };
  }
}