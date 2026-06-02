import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legislativeUpdates, tenantLegislativeActions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/legislative-updates
 * List all legislative updates (system-wide).
 * Shows per-tenant actioned state via the junction table.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    // Get all system-wide updates
    const allUpdates = await db
      .select()
      .from(legislativeUpdates)
      .orderBy(legislativeUpdates.effectiveDate);

    // Get the IDs this tenant has already actioned
    const actioned = await db
      .select({ updateId: tenantLegislativeActions.updateId })
      .from(tenantLegislativeActions)
      .where(eq(tenantLegislativeActions.tenantId, tenantId));

    const actionedIds = new Set(actioned.map(a => a.updateId));

    // Merge — mark actioned for this tenant
    const merged = allUpdates.map(u => ({
      ...u,
      isActioned: actionedIds.has(u.id),
    }));

    return NextResponse.json(merged);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to list updates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}