import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/documents
 * List tenant documents for the authenticated user's tenant.
 */
export async function GET(_request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(documents.createdAt);
    return NextResponse.json(docs);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to list documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
