import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legislativeUpdates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/legislative-updates/:id/apply
 * Mark a legislative update as actioned.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.update(legislativeUpdates)
      .set({ isActioned: true })
      .where(eq(legislativeUpdates.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to apply update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
