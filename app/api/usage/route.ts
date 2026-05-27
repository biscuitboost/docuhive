import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

/**
 * GET /api/usage?tenantId=xxx
 * Current period document count for metered billing.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

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
    const message = error instanceof Error ? error.message : 'Failed to get usage';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
