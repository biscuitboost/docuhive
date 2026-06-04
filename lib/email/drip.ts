/**
 * Onboarding email drip sequence for DocuHive.
 * A 5-email sequence over 14 days designed to convert free trial users
 * into active document generators (and eventually paid subscribers).
 *
 * Email cadence:
 *   1. Day 1: Welcome + Quick Start (tools hub → generate first doc)
 *   2. Day 3: Tool Spotlight (PAYE / holiday entitlement calculators)
 *   3. Day 7: Smart Features (template editor, bulk actions, comparison)
 *   4. Day 10: Social Proof + Upgrade CTA
 *   5. Day 14: Trial Expiry Warning
 */

import { db } from "@/lib/db";
import { tenants, tenantMembers, emailDripTracking } from "@/lib/db/schema";
import { eq, and, lt, gte, inArray } from "drizzle-orm";
import { sendEmail } from "./send";

// ── Types ──────────────────────────────────────────────────────────

export type DripEmailType =
  | "onboarding_welcome"
  | "onboarding_tool_spotlight"
  | "onboarding_smart_features"
  | "onboarding_social_proof"
  | "onboarding_trial_expiry";

export interface DripSequenceItem {
  type: DripEmailType;
  subject: string;
  day: number;
  buildHtml: (params: { tenantName: string; companyName: string }) => string;
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

// ── Drip Sequence Definitions ──────────────────────────────────────

export const DRIP_SEQUENCE: DripSequenceItem[] = [
  {
    type: "onboarding_welcome",
    subject: "Welcome to DocuHive — Your First Document is Minutes Away",
    day: 1,
    buildHtml: ({ tenantName, companyName }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Welcome to DocuHive, ${tenantName}!`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Thanks for signing up${companyName ? ` for ${companyName}` : ""}. We're here to help you
          create professional UK business documents in minutes — not hours.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong style="color:#111827;">Here's how to get started:</strong>
        </p>
        <ol style="margin:0 0 16px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
          <li>Visit the <strong>Free Tools</strong> page — try our PAYE calculator or VAT calculator</li>
          <li>Generate your first document — an Employment Contract or NDA takes under 60 seconds</li>
          <li>Explore the dashboard to see your document history and usage stats</li>
        </ol>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          All Essentials plan features are available immediately. You can generate up to
          10 documents to explore the platform.
        </p>`,
        ctaText: "Generate Your First Document",
        ctaUrl: "https://docuhive.app/documents/new",
      }),
  },
  {
    type: "onboarding_tool_spotlight",
    subject: "Free Calculators That Save You Hours — Try Them Now",
    day: 3,
    buildHtml: ({ tenantName }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Did You Know DocuHive Has Free Business Calculators, ${tenantName}?`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Alongside document generation, DocuHive includes a growing suite of free UK business tools:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;">
              <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">💰 PAYE Calculator</p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Income tax, NI, and take-home pay for any salary</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;">
              <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">📅 Holiday Entitlement Calculator</p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Full-time, part-time, irregular hours</p>
            </td>
          </tr>
          <tr><td style="height:8px;"></td></tr>
          <tr>
            <td style="padding:12px 16px;background-color:#f9fafb;border-radius:8px;">
              <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">💸 VAT Calculator</p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Add/remove VAT, gross/net calculations</p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          Tools are free and don't count toward your document limit. Use them to run payroll
          figures, check holiday entitlement, or estimate corporation tax — then generate
          the corresponding document with one click.
        </p>`,
        ctaText: "Explore Free Tools",
        ctaUrl: "https://docuhive.app/tools",
      }),
  },
  {
    type: "onboarding_smart_features",
    subject: "Unlock More Power — Smart Pre-fill, Templates & Bulk Actions",
    day: 7,
    buildHtml: ({ tenantName }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Pro Tips to Speed Up Your Workflow, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          You've been using DocuHive for a week — here are three features that power users love:
        </p>
        <p style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:600;">✨ Smart Pre-fill</p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.5;">
          When generating a new document, DocuHive can automatically extract employee data
          from your previous documents — no need to re-type names, salaries, or dates.
        </p>
        <p style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:600;">📄 Saved Form Templates</p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.5;">
          Save your commonly-used form values as reusable templates. Generate an offer letter
          with your company's standard terms in two clicks.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:13px;line-height:1.5;">
          <strong>Pro tip:</strong> You can also bulk-archive or bulk-download documents from the
          document list — tick the checkbox, click the action button, done.
        </p>`,
        ctaText: "See What's New",
        ctaUrl: "https://docuhive.app/documents",
      }),
  },
  {
    type: "onboarding_social_proof",
    subject: "Join 100+ UK Businesses Using DocuHive",
    day: 10,
    buildHtml: ({ tenantName }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Trusted by UK Small Businesses, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          DocuHive is helping UK businesses save hours on document creation. Here's what
          customers are saying:
        </p>
        <blockquote style="margin:0 0 16px;padding:16px 20px;background-color:#f9fafb;border-left:4px solid #2563eb;border-radius:4px;color:#374151;font-size:14px;font-style:italic;line-height:1.6;">
          "Generated an employment contract in under a minute. The AI suggestions are
          incredibly accurate for UK employment law."
        </blockquote>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          When you're ready to go beyond the Essentials plan's 10-document limit, upgrading
          to <strong>Pro (£79/mo)</strong> gives you unlimited documents, custom branding,
          and priority AI models. <strong>Team (£99/mo)</strong> adds multi-user access for
          up to 10 team members.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong>Any feedback?</strong> Reply to this email — we read every message and
          ship improvements based on user input.
        </p>`,
        ctaText: "View Pricing",
        ctaUrl: "https://docuhive.app/pricing",
        secondaryText: "No pressure — you still have documents remaining on your Essentials plan.",
      }),
  },
  {
    type: "onboarding_trial_expiry",
    subject: "Your DocuHive Trial is About to Expire — What You'll Lose",
    day: 14,
    buildHtml: ({ tenantName }) =>
      buildEmailLayout({
        title: "DocuHive",
        headline: `Don't Lose Access, ${tenantName}`,
        body: `<p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          It's been two weeks since you signed up for DocuHive, and we wanted to remind you
          what's available on your plan.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong style="color:#111827;">With the Essentials plan you get:</strong>
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
          <li>10 AI-generated documents per month</li>
          <li>26 document types (employment, contracts, data protection, commercial)</li>
          <li>Free business tools (PAYE, VAT, holiday entitlement calculators)</li>
          <li>PDF &amp; Word downloads</li>
          <li>Email document sharing with open tracking</li>
        </ul>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
          <strong style="color:#111827;">Upgrade to Pro (£79/mo)</strong> and unlock unlimited
          documents, custom branding, priority AI, and the template editor.
        </p>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.5;">
          Your documents and data will remain accessible, but you won't be able to generate
          new ones beyond your plan limit.
        </p>`,
        ctaText: "Upgrade Now",
        ctaUrl: "https://docuhive.app/pricing",
        secondaryText: "Still need more time? Your documents stay safe — just upgrade when you're ready.",
      }),
  },
];

// ── Drip Email Sending ─────────────────────────────────────────────

/**
 * Get the email address for a tenant's owner/admin user via Clerk API.
 * Falls back gracefully if Clerk API is unavailable.
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
    console.warn(`[drip] Could not resolve email for tenant ${tenantId}`);
    return null;
  }
}

/**
 * Check if a specific drip email has already been sent to this tenant.
 */
async function hasBeenSent(tenantId: string, emailType: DripEmailType): Promise<boolean> {
  const existing = await db
    .select({ id: emailDripTracking.id })
    .from(emailDripTracking)
    .where(
      and(
        eq(emailDripTracking.tenantId, tenantId),
        eq(emailDripTracking.emailType, emailType)
      )
    )
    .limit(1);
  return existing.length > 0;
}

/**
 * Find tenants eligible for a given drip email day.
 * Eligible = created on that specific day window AND on Essentials plan AND haven't received it.
 */
async function findEligibleTenants(
  day: number
): Promise<{ id: string; name: string; companyName: string | null }[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - day);
  cutoff.setHours(0, 0, 0, 0);

  const endOfWindow = new Date(cutoff);
  endOfWindow.setDate(endOfWindow.getDate() + 1);

  const sequenceItem = DRIP_SEQUENCE.find((d) => d.day === day);
  if (!sequenceItem) return [];

  const allTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      companyName: tenants.companyName,
    })
    .from(tenants)
    .where(
      and(
        gte(tenants.createdAt, cutoff),
        lt(tenants.createdAt, endOfWindow),
        eq(tenants.plan, "essentials")
      )
    );

  // Filter out tenants that already received this drip email
  const eligible: typeof allTenants = [];
  for (const tenant of allTenants) {
    const sent = await hasBeenSent(tenant.id, sequenceItem.type);
    if (!sent) {
      eligible.push(tenant);
    }
  }

  return eligible;
}

/**
 * Run the full drip email check for a single day window.
 * Called by the cron endpoint for each day in the sequence.
 */
export async function sendDripEmailsForDay(day: number): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const eligibleTenants = await findEligibleTenants(day);
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const sequenceItem = DRIP_SEQUENCE.find((d) => d.day === day);
  if (!sequenceItem) return { sent: 0, skipped: 0, errors: 0 };

  for (const tenant of eligibleTenants) {
    try {
      const email = await getTenantEmail(tenant.id);
      if (!email) {
        skipped++;
        continue;
      }

      const html = sequenceItem.buildHtml({
        tenantName: tenant.name.replace(/'s Company$/, ""),
        companyName: tenant.companyName ?? "",
      });

      const result = await sendEmail({
        to: email,
        subject: sequenceItem.subject,
        html,
      });

      if (result.success) {
        await db.insert(emailDripTracking).values({
          tenantId: tenant.id,
          emailType: sequenceItem.type,
        });
        sent++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { sent, skipped, errors };
}

/**
 * Run the full drip sequence for all day windows.
 * Called by the cron endpoint once per day.
 */
export async function runDripSequence(): Promise<
  Record<string, { sent: number; skipped: number; errors: number }>
> {
  const results: Record<string, { sent: number; skipped: number; errors: number }> = {};

  for (const item of DRIP_SEQUENCE) {
    results[item.type] = await sendDripEmailsForDay(item.day);
  }

  return results;
}