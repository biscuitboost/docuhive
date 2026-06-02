import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legislativeUpdates } from '@/lib/db/schema';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/legislative-updates
 * List all legislative updates (system-wide, not tenant-scoped).
 * Requires a valid auth session.
 */
export async function GET() {
  try {
    await requireAuth();
    const updates = await db.select().from(legislativeUpdates).orderBy(legislativeUpdates.effectiveDate);
    return NextResponse.json(updates);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to list updates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
