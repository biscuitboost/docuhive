import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legislativeUpdates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * POST /api/legislative-updates/:id/apply
 * Mark a legislative update as actioned.
 * Requires a valid auth session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    await db.update(legislativeUpdates)
      .set({ isActioned: true })
      .where(eq(legislativeUpdates.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to apply update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
