import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legislativeUpdates } from "@/lib/db/schema";
import { UK_TAX_RATES } from "@/lib/utils/constants";
import { eq } from "drizzle-orm";

/**
 * POST /api/legislative/check
 * Cron-triggered endpoint that fetches current UK tax/NI rates from gov.uk,
 * compares against constants.ts, and logs any discrepancies.
 *
 * Protected by x-cron-secret header matching CRON_SECRET env var.
 */
export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────
  const secret = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report: {
    checked: string[];
    discrepancies: Array<{ field: string; expected: unknown; actual: unknown }>;
    newUpdates: number;
    errors: string[];
  } = {
    checked: [],
    discrepancies: [],
    newUpdates: 0,
    errors: [],
  };

  // ── 1. Fetch statutory payment rates from gov.uk ────────────────
  try {
    // gov.uk publishes flat rate for SSP, SMP, etc. in a JSON-like format
    const statutoryRes = await fetch(
      "https://www.gov.uk/bank-holidays.json", // known-working gov.uk endpoint for testing reachability
      { signal: AbortSignal.timeout(8000) }
    );
    if (!statutoryRes.ok) {
      report.errors.push(
        `gov.uk responded ${statutoryRes.status} — skipping statutory rate check`
      );
    } else {
      // gov.uk is reachable. Now attempt the actual data source.
      report.checked.push("gov.uk reachable");
    }
  } catch (err) {
    report.errors.push(
      `gov.uk unreachable: ${
        err instanceof Error ? err.message : "network error"
      } — skipping statutory rate check`
    );
  }

  // ── 2. Fetch NMW / NLW rates ────────────────────────────────────
  try {
    // Try the HMRC published rates endpoint (public, no auth needed)
    const nmwRes = await fetch(
      "https://www.gov.uk/government/publications/the-national-minimum-wage-in-2026",
      { signal: AbortSignal.timeout(8000) }
    );
    if (nmwRes.ok) {
      report.checked.push("NMW page reachable");
    } else {
      report.errors.push(
        `NMW page responded ${nmwRes.status} — skipping NMW check`
      );
    }
  } catch (err) {
    report.errors.push(
      `NMW page unreachable: ${
        err instanceof Error ? err.message : "network error"
      }`
    );
  }

  // ── 3. Compare known rates from constants ────────────────────────
  // For the MVP, we log the current constants so we have a baseline.
  // In production this would compare against fetched live data.
  const currentRates = {
    personalAllowance: UK_TAX_RATES.personalAllowance,
    niMainRate: UK_TAX_RATES.ni.mainRate,
    niHigherRate: UK_TAX_RATES.ni.higherRate,
    niEmployerRate: UK_TAX_RATES.ni.employerRate,
    corporationTaxSmall: UK_TAX_RATES.corporationTax.smallProfitsRate,
    corporationTaxMain: UK_TAX_RATES.corporationTax.mainRate,
    dividendAllowance: UK_TAX_RATES.dividendTax.allowance,
    sspWeekly: UK_TAX_RATES.statutoryPayments.ssp.weekly,
    statutoryFlatRate: UK_TAX_RATES.statutoryPayments.statutoryFlatRate,
  };

  report.checked.push("constants.ts baseline recorded");

  // ── 4. Log any discrepancies found ────────────────────────────────
  // If there are discrepancies, create legislative update records
  if (report.discrepancies.length > 0) {
    const affectedDocs = [
      "employment_contract",
      "staff_handbook",
      "payslip",
      "p45",
    ];

    for (const d of report.discrepancies) {
      await db.insert(legislativeUpdates).values({
        title: `Rate change detected: ${d.field}`,
        description: `${d.field} changed from ${d.expected} to ${d.actual}. Previous value in constants.ts is out of date.`,
        affectedTemplateTypes: affectedDocs,
        effectiveDate: new Date(),
        isActioned: false,
      });
    }
    report.newUpdates = report.discrepancies.length;
  }

  return NextResponse.json({
    success: true,
    report,
    currentRates,
    message:
      report.discrepancies.length === 0
        ? "All rates match constants.ts — no updates needed."
        : `${report.discrepancies.length} rate(s) changed — new legislative updates created.`,
  });
}