import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";

/**
 * GET /api/templates/[id]
 * Get a single template by ID (scoped to current tenant).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireAuth();
    const { id } = await params;

    const [template] = await db
      .select()
      .from(documentTemplates)
      .where(and(eq(documentTemplates.id, id), eq(documentTemplates.tenantId, tenantId)))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to load template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/templates/[id]
 * Update a template (name, promptTemplate, isActive). Scoped to current tenant.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Build update fields — only allow specific fields
    const updateFields: Record<string, unknown> = {};
    if (typeof body.name === "string") updateFields.name = body.name;
    if (typeof body.promptTemplate === "string") updateFields.promptTemplate = body.promptTemplate;
    if (typeof body.isActive === "boolean") updateFields.isActive = body.isActive;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Bump version if prompt changed
    if (body.promptTemplate) {
      const [existing] = await db
        .select({ version: documentTemplates.version })
        .from(documentTemplates)
        .where(and(eq(documentTemplates.id, id), eq(documentTemplates.tenantId, tenantId)))
        .limit(1);

      if (existing) {
        updateFields.version = existing.version + 1;
      }
    }

    const [updated] = await db
      .update(documentTemplates)
      .set(updateFields as any)
      .where(and(eq(documentTemplates.id, id), eq(documentTemplates.tenantId, tenantId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template. Scoped to current tenant.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(documentTemplates)
      .where(and(eq(documentTemplates.id, id), eq(documentTemplates.tenantId, tenantId)))
      .returning({ id: documentTemplates.id });

    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}