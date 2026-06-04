/**
 * GET /api/keys/[id] — Get a single API key (redacted info)
 * PATCH /api/keys/[id] — Update API key (name, isActive)
 * DELETE /api/keys/[id] — Revoke/delete an API key
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ── Get Single Key ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    const [key] = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastFour: apiKeys.lastFour,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, params.id), eq(apiKeys.tenantId, tenantId))
      )
      .limit(1);

    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({ key });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to get key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Update Key ─────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const [existing] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, params.id), eq(apiKeys.tenantId, tenantId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, params.id))
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastFour: apiKeys.lastFour,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      });

    return NextResponse.json({ key: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to update key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Delete / Revoke Key ────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireAuth();

    // Verify ownership before deleting
    const [existing] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, params.id), eq(apiKeys.tenantId, tenantId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}