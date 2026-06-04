/**
 * POST /api/keys
 * Create a new API key for the authenticated tenant.
 * Requires Clerk session (not public API key).
 *
 * GET /api/keys
 * List all API keys for the authenticated tenant (redacted).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateApiKey, redactApiKey } from "@/lib/utils/api-keys";

// ── List API Keys ──────────────────────────────────────────────────

export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    const keys = await db
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
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to list keys";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Create API Key ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireAuth();
    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 }
      );
    }

    const name = body.name.trim();

    // Generate the key
    const { plaintextKey, keyPrefix, keyHash, lastFour } = generateApiKey(name);

    // Store it
    const [keyRecord] = await db
      .insert(apiKeys)
      .values({
        tenantId,
        name,
        keyPrefix,
        keyHash,
        lastFour,
      })
      .returning({ id: apiKeys.id });

    return NextResponse.json(
      {
        id: keyRecord.id,
        name,
        key: plaintextKey, // Only time plaintext is returned
        keyPrefix,
        lastFour,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to create key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}