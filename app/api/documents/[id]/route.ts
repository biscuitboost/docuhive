import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// Import the document status enum type
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth/tenant';
import { createNotification } from '@/lib/documents/notifications';

/**
 * GET /api/documents/:id
 * Returns document details including content and a download URL.
 * Response: { id, title, content, downloadUrl, status, type, createdAt, updatedAt }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = result[0];

    // Tenant isolation — only the owning tenant can access this document
    if (doc.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      content: doc.outputData ?? null,
      inputData: doc.inputData ?? null,
      aiModel: doc.aiModel ?? null,
      version: doc.version,
      currentIssuedVersion: doc.currentIssuedVersion ?? null,
      downloadUrl: `/api/documents/${doc.id}/download`,
      wordDownloadUrl: `/api/documents/${doc.id}/download/word`,
      status: doc.status,
      type: doc.type,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to get document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id
 * Soft-delete a document (tenant-scoped).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const result = await db
      .select({ tenantId: documents.tenantId, title: documents.title })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (result[0].tenantId !== tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await db
      .update(documents)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(documents.id, params.id));

    // Create notification
    await createNotification(
      tenantId,
      "document_archived",
      "Document Archived",
      `"${result[0].title}" has been archived.`,
      `/documents/${params.id}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/:id
 * Update document properties (status for archive/restore).
 * Body: { status: "archived" | "generated" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const result = await db
      .select({ tenantId: documents.tenantId, status: documents.status, title: documents.title })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (result[0].tenantId !== tenantId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const validStatuses = ["archived", "generated", "downloaded", "draft"];
    const newStatus = body.status as string;

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const oldStatus = result[0].status;
    await db
      .update(documents)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(documents.id, params.id));

    // Create notification for restore
    if (oldStatus === "archived" && newStatus === "generated") {
      await createNotification(
        tenantId,
        "document_restored",
        "Document Restored",
        `"${result[0].title}" has been restored from archive.`,
        `/documents/${params.id}`,
      );
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
