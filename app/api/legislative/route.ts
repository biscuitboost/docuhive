import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legislativeUpdates } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/legislative
 * Returns all legislative updates from the DB (most recent first).
 * No auth required — used by the cron check, admin view, and tenant dashboard.
 */
export async function GET() {
  try {
    const updates = await db
      .select()
      .from(legislativeUpdates)
      .orderBy(desc(legislativeUpdates.effectiveDate));

    return NextResponse.json(updates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch legislative updates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}