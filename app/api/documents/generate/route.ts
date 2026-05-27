import { NextRequest, NextResponse } from 'next/server';
import { generateDocument } from '@/lib/documents/generate';

/**
 * POST /api/documents/generate
 * Generate a new document (AI call + PDF render).
 * Body: { tenantId, type, title, inputData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Validate tenant auth + plan limits via Clerk session
    const result = await generateDocument(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
