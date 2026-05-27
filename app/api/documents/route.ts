import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/documents
 * List tenant documents. Query: ?tenantId=xxx&type=contract&status=draft
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    // TODO: Validate tenant access via Clerk session
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }
    const docs = await db.select().from(documents).where(eq(documents.tenantId, tenantId));
    return NextResponse.json(docs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
