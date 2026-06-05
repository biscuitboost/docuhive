import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { legislativeUpdates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/legislative/[id]
 * Toggle the isActioned flag on a legislative update.
 * No auth required — used by admin page.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current state
    const [existing] = await db
      .select({ isActioned: legislativeUpdates.isActioned })
      .from(legislativeUpdates)
      .where(eq(legislativeUpdates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Legislative update not found" }, { status: 404 });
    }

    // Toggle
    const [updated] = await db
      .update(legislativeUpdates)
      .set({ isActioned: !existing.isActioned })
      .where(eq(legislativeUpdates.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update legislative update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}