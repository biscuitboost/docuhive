import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/documents/:id/download
 * Download document PDF/Word file.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await db.select().from(documents).where(eq(documents.id, params.id)).limit(1);
    if (!doc.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    // TODO: Redirect to blob storage URL or stream from R2/Vercel Blob
    const { outputUrl, title } = doc[0];
    if (!outputUrl) {
      return NextResponse.json({ error: 'No file available' }, { status: 404 });
    }
    return NextResponse.redirect(outputUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
