import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documentTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/templates/:type
 * Get template schema for form rendering.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const template = await db.select()
      .from(documentTemplates)
      .where(and(eq(documentTemplates.type, params.type as any), eq(documentTemplates.isActive, true)))
      .limit(1);
    if (!template.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
