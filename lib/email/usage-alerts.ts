/**
 * Usage-based alert emails for DocuHive.
 * Sends proactive upgrade nudges when essentials-plan tenants approach
 * their 10-document monthly limit.
 *
 * Thresholds:
 *   5 docs: "Halfway there — here's how to make the most of your allowance"
 *   8 docs: "Nearly there — only 2 documents left this month"
 *   9 docs: "Last one! Upgrade to generate unlimited documents"
 */

import { db } from "@/lib/db";
import { tenants, tenantMembers, documents, emailDripTracking } from "@/lib/db/schema";
import { eq, and, gte, sql, lt, lte } from "drizzle-orm";
import { sendEmail } from "./send";

// ── Types ──────────────────────────────────────────────────────────

export interface UsageAlertConfig {
  threshold: number;
  emailType: string;
  subject: string;
  buildHtml: (params: {
    tenantName: string;
    companyName: string;
    docsUsed: number;
    docsRemaining: number;
  }) => string;
}

// ── Email Templates ────────────────────────────────────────────────

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

// ── Alert Definitions ──────────────────────────────────────────────

const PLAN_LIMIT = 10;

export const USAGE_ALERTS: UsageAlertConfig[] = [
  {
    threshold: 5,
    emailType: "usage_alert_5",
    subject: "You've Used 5 of 10 Documents — Halfway to Your Monthly Limit",
    buildHtml: ({ tenantName, companyName, docsUsed, docsRemaining }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Halfway Through Your Allowance, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          You've used <strong style="color:#111827;">${docsUsed} of ${PLAN_LIMIT}</strong> documents
          this month${companyName ? ` for ${companyName}` : ""}. That's ${docsRemaining} remaining.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Here are some tips to stretch your allowance:
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
          <li>Use <strong>Saved Templates</strong> to pre-fill common fields — fewer regenerations</li>
          <li>Our <strong>free calculators</strong> (PAYE, VAT, holiday entitlement) don't count toward your limit</li>
          <li>Need more? <strong>Pro (£79/mo)</strong> gives you unlimited documents</li>
        </ul>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Your documents stay safe and accessible regardless of your plan.
        </p>`,
        ctaText: "View Your Usage",
        ctaUrl: "https://docuhive.app/dashboard",
        secondaryText: "Upgrade anytime for unlimited document generation.",
      }),
  },
  {
    threshold: 8,
    emailType: "usage_alert_8",
    subject: "Only 2 Documents Left This Month — Don't Get Blocked",
    buildHtml: ({ tenantName, companyName, docsUsed, docsRemaining }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `${docsRemaining} Documents Remaining, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          You've used <strong style="color:#111827;">${docsUsed} of ${PLAN_LIMIT}</strong> documents
          this month${companyName ? ` for ${companyName}` : ""}.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Once you hit ${PLAN_LIMIT}, you won't be able to generate new documents until your
          next billing cycle — or you upgrade to <strong style="color:#111827;">Pro (£79/mo)</strong>
          for unlimited generation.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong style="color:#111827;">Pro benefits:</strong>
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
          <li>Unlimited document generation</li>
          <li>Custom branding (logo, colours, headers)</li>
          <li>Priority AI models for better quality</li>
          <li>Template editor for custom prompt templates</li>
        </ul>`,
        ctaText: "Upgrade to Pro — £79/mo",
        ctaUrl: "https://docuhive.app/pricing",
        secondaryText: "Still need time? Your documents remain accessible even after you hit the limit.",
      }),
  },
  {
    threshold: 9,
    emailType: "usage_alert_9",
    subject: "Last Document Available — Upgrade for Unlimited Access",
    buildHtml: ({ tenantName, companyName, docsUsed, docsRemaining }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `This Is Your Last Document, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          You've used <strong style="color:#111827;">${docsUsed} of ${PLAN_LIMIT}</strong> documents this month
          ${companyName ? `for ${companyName}` : ""}. After your next generation, you'll
          need to upgrade to continue.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong style="color:#111827;">Don't get caught out.</strong> Upgrade to
          <strong style="color:#111827;">Pro (£79/mo)</strong> now and keep generating
          unlimited UK business documents without interruption.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Your existing documents and data will be preserved regardless of your plan choice.
        </p>`,
        ctaText: "Upgrade & Keep Going",
        ctaUrl: "https://docuhive.app/pricing",
        secondaryText: "Already on Pro? No action needed — you're already unlimited.",
      }),
  },
];

// ── Alert Logic ────────────────────────────────────────────────────

/**
 * Get the start of the current billing month for usage counting.
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get a "billing month key" like "2026-06" for scoping alert tracking.
 */
function getBillingMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Check if a specific usage alert was already sent this billing month.
 */
async function hasAlertBeenSentThisMonth(
  tenantId: string,
  emailType: string
): Promise<boolean> {
  const monthStart = getMonthStart();
  const existing = await db
    .select({ id: emailDripTracking.id })
    .from(emailDripTracking)
    .where(
      and(
        eq(emailDripTracking.tenantId, tenantId),
        eq(emailDripTracking.emailType, emailType),
        gte(emailDripTracking.sentAt, monthStart)
      )
    )
    .limit(1);
  return existing.length > 0;
}

/**
 * Get the monthly document count for a tenant.
 */
async function getMonthlyDocCount(tenantId: string): Promise<number> {
  const monthStart = getMonthStart();
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        gte(documents.createdAt, monthStart)
      )
    )
    .limit(1);
  return result[0]?.count ?? 0;
}

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
          sql`${tenantMembers.role} IN ('owner', 'admin')`
        )
      )
      .limit(1);

    if (member.length === 0) return null;

    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = clerkClient();
    const clerkUser = await clerk.users.getUser(member[0].clerkUserId);
    return clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    console.warn(`[usage-alerts] Could not resolve email for tenant ${tenantId}`);
    return null;
  }
}

/**
 * Process usage alerts for all essentials-plan tenants.
 * Checks each tenant's monthly document count against alert thresholds
 * and sends emails for any threshold that has been newly crossed.
 */
export async function processUsageAlerts(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
  alerts: Record<string, { threshold: number; action: "sent" | "skipped" | "error"; tenantId: string }[]>;
}> {
  const monthStart = getMonthStart();
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const alerts: Record<string, { threshold: number; action: "sent" | "skipped" | "error"; tenantId: string }[]> = {};

  // Get all essentials-plan tenants
  const essentialsTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      companyName: tenants.companyName,
    })
    .from(tenants)
    .where(eq(tenants.plan, "essentials"));

  for (const tenant of essentialsTenants) {
    const docCount = await getMonthlyDocCount(tenant.id);

    // Check each alert threshold
    for (const alert of USAGE_ALERTS) {
      // Only fire when doc count is exactly at or just crossed the threshold
      // We check: docsUsed >= threshold AND docsUsed < (threshold + next increment)
      // Actually simpler: fire if docsUsed >= threshold and docsUsed < PLAN_LIMIT (not blocked yet)
      // AND the alert hasn't been sent yet this month.
      // But that would re-fire every day after crossing. So we need the "has been sent" check.

      if (docCount >= alert.threshold && docCount < PLAN_LIMIT) {
        const alreadySent = await hasAlertBeenSentThisMonth(tenant.id, alert.emailType);
        if (alreadySent) {
          continue; // Already sent this threshold this month
        }

        // Send the alert
        const email = await getTenantEmail(tenant.id);
        if (!email) {
          skipped++;
          (alerts[alert.emailType] = alerts[alert.emailType] || []).push({
            threshold: alert.threshold,
            action: "skipped",
            tenantId: tenant.id,
          });
          continue;
        }

        try {
          const docsRemaining = PLAN_LIMIT - docCount;
          const html = alert.buildHtml({
            tenantName: tenant.name.replace(/'s Company$/, ""),
            companyName: tenant.companyName ?? "",
            docsUsed: docCount,
            docsRemaining,
          });

          const result = await sendEmail({
            to: email,
            subject: alert.subject,
            html,
          });

          if (result.success) {
            await db.insert(emailDripTracking).values({
              tenantId: tenant.id,
              emailType: alert.emailType,
            });
            sent++;
            (alerts[alert.emailType] = alerts[alert.emailType] || []).push({
              threshold: alert.threshold,
              action: "sent",
              tenantId: tenant.id,
            });
          } else {
            errors++;
            (alerts[alert.emailType] = alerts[alert.emailType] || []).push({
              threshold: alert.threshold,
              action: "error",
              tenantId: tenant.id,
            });
          }
        } catch {
          errors++;
          (alerts[alert.emailType] = alerts[alert.emailType] || []).push({
            threshold: alert.threshold,
            action: "error",
            tenantId: tenant.id,
          });
        }
      }
    }
  }

  return { sent, skipped, errors, alerts };
}

/**
 * Process a single threshold (useful for manual or cron testing).
 */
export async function processUsageAlertForThreshold(
  threshold: number
): Promise<{ sent: number; skipped: number; errors: number }> {
  const alertConfig = USAGE_ALERTS.find((a) => a.threshold === threshold);
  if (!alertConfig) return { sent: 0, skipped: 0, errors: 0 };

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const essentialsTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      companyName: tenants.companyName,
    })
    .from(tenants)
    .where(eq(tenants.plan, "essentials"));

  for (const tenant of essentialsTenants) {
    const docCount = await getMonthlyDocCount(tenant.id);

    if (docCount >= threshold && docCount < PLAN_LIMIT) {
      const alreadySent = await hasAlertBeenSentThisMonth(tenant.id, alertConfig.emailType);
      if (alreadySent) continue;

      const email = await getTenantEmail(tenant.id);
      if (!email) {
        skipped++;
        continue;
      }

      try {
        const docsRemaining = PLAN_LIMIT - docCount;
        const html = alertConfig.buildHtml({
          tenantName: tenant.name.replace(/'s Company$/, ""),
          companyName: tenant.companyName ?? "",
          docsUsed: docCount,
          docsRemaining,
        });

        const result = await sendEmail({
          to: email,
          subject: alertConfig.subject,
          html,
        });

        if (result.success) {
          await db.insert(emailDripTracking).values({
            tenantId: tenant.id,
            emailType: alertConfig.emailType,
          });
          sent++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }
  }

  return { sent, skipped, errors };
}