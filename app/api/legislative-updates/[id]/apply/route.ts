import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenantLegislativeActions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * POST /api/legislative-updates/:id/apply
 * Mark a legislative update as actioned for the current tenant.
 * Uses a junction table so each tenant's actioned state is independent.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    // Check if already actioned by this tenant
    const existing = await db
      .select()
      .from(tenantLegislativeActions)
      .where(
        and(
          eq(tenantLegislativeActions.tenantId, tenantId),
          eq(tenantLegislativeActions.updateId, params.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(tenantLegislativeActions).values({
        tenantId,
        updateId: params.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to apply update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}