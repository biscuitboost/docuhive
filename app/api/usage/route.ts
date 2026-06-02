import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/usage
 * Current period document count for metered billing.
 * Resolves tenant from auth session — no query param needed.
 */
export async function GET(_request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    // Get start of current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(and(
        eq(documents.tenantId, tenantId),
        gte(documents.createdAt, startOfMonth)
      ));

    return NextResponse.json({ documentsUsed: result[0]?.count || 0 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to get usage';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}