/**
 * Cron endpoint for sending onboarding email drip.
 * Called daily by Vercel Cron Jobs (or manually).
 * Protected by CRON_SECRET header check.
 *
 * GET /api/cron/onboarding-emails
 *   ?secret=<CRON_SECRET>    — required, matches env var
 *   ?day=1                   — optional, single day (default: all 5)
 */

import { NextRequest, NextResponse } from "next/server";
import { runDripSequence, sendDripEmailsForDay, DRIP_SEQUENCE } from "@/lib/email/drip";

// ── GET /api/cron/onboarding-emails ─────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!secret || !expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse optional day parameter
  const dayParam = searchParams.get("day");
  const specificDay = dayParam ? parseInt(dayParam, 10) : null;

  if (specificDay !== null && (isNaN(specificDay) || specificDay < 1 || specificDay > 14)) {
    return NextResponse.json(
      { error: "Day must be between 1 and 14" },
      { status: 400 }
    );
  }

  try {
    let results: Record<string, { sent: number; skipped: number; errors: number }>;

    if (specificDay !== null) {
      // Run a single day window
      const item = DRIP_SEQUENCE.find((d) => d.day === specificDay);
      const dayResult = await sendDripEmailsForDay(specificDay);
      results = item ? { [item.type]: dayResult } : { [`day_${specificDay}`]: dayResult };
    } else {
      // Run all day windows
      results = await runDripSequence();
    }

    const totalSent = Object.values(results).reduce((sum, r) => sum + r.sent, 0);
    const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        sent: totalSent,
        skipped: totalSkipped,
        errors: totalErrors,
        total: totalSent + totalSkipped + totalErrors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron/onboarding-emails]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}