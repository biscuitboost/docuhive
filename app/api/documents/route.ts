import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';

/**
 * GET /api/documents
 * List tenant documents for the authenticated user's tenant.
 * Supports pagination via ?page=1&limit=20 (default page=1, limit=20).
 * Returns: { data, total, page, totalPages }
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    const [{ total }] = await db
      .select({ total: count() })
      .from(documents)
      .where(eq(documents.tenantId, tenantId));

    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.tenantId, tenantId))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: docs,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to list documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
