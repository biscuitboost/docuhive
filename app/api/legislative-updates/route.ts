import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legislativeUpdates } from '@/lib/db/schema';

/**
 * GET /api/legislative-updates
 * List pending legislative updates for a tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const updates = await db.select().from(legislativeUpdates).orderBy(legislativeUpdates.effectiveDate);
    return NextResponse.json(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list updates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
