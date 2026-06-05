/**
 * Cron endpoint for sending usage-based alert emails.
 * Called daily by Vercel Cron Jobs (or manually).
 * Checks essentials-plan tenants approaching their 10-document limit
 * and sends proactive upgrade nudges.
 *
 * GET /api/cron/usage-alerts
 *   ?secret=<CRON_SECRET>          — required, matches env var
 *   ?threshold=5                   — optional, process a single threshold
 */

import { NextRequest, NextResponse } from "next/server";
import { processUsageAlerts, processUsageAlertForThreshold, USAGE_ALERTS } from "@/lib/email/usage-alerts";

// ── GET /api/cron/usage-alerts ─────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse optional threshold parameter
  const thresholdParam = searchParams.get("threshold");
  const specificThreshold = thresholdParam ? parseInt(thresholdParam, 10) : null;

  if (specificThreshold !== null) {
    const validThresholds = USAGE_ALERTS.map((a) => a.threshold);
    if (isNaN(specificThreshold) || !validThresholds.includes(specificThreshold)) {
      return NextResponse.json(
        { error: `Threshold must be one of: ${validThresholds.join(", ")}` },
        { status: 400 }
      );
    }
  }

  try {
    let result: {
      sent: number;
      skipped: number;
      errors: number;
      alerts?: Record<string, { threshold: number; action: string; tenantId: string }[]>;
    };

    if (specificThreshold !== null) {
      const alertResult = await processUsageAlertForThreshold(specificThreshold);
      result = alertResult;
    } else {
      result = await processUsageAlerts();
    }

    return NextResponse.json({
      success: true,
      ...result,
      summary: {
        sent: result.sent,
        skipped: result.skipped,
        errors: result.errors,
        total: result.sent + result.skipped + result.errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/usage-alerts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}