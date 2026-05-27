import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documentTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/templates
 * List active document templates.
 */
export async function GET() {
  try {
    const templates = await db.select().from(documentTemplates).where(eq(documentTemplates.isActive, true));
    return NextResponse.json(templates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
