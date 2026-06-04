/**
 * Public API authentication via Bearer token.
 * Validates an API key from the Authorization header, looks up its hash
 * in the api_keys table, and resolves the tenant.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hashApiKey, isValidKeyFormat } from "@/lib/utils/api-keys";
import { sql } from "drizzle-orm";

export interface PublicAuthResult {
  tenantId: string;
  apiKeyId: string;
  keyName: string;
}

export class PublicAuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "PublicAuthError";
  }
}

/**
 * Extract and validate a Bearer token from the request.
 * Returns { tenantId, apiKeyId, keyName } if valid.
 * Throws PublicAuthError with appropriate status code on failure.
 */
export async function authenticatePublicRequest(
  request: NextRequest
): Promise<PublicAuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    throw new PublicAuthError("Missing Authorization header", 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new PublicAuthError(
      "Authorization header must use Bearer scheme",
      401
    );
  }

  const key = authHeader.slice(7).trim();

  if (!key) {
    throw new PublicAuthError("Empty API key", 401);
  }

  if (!isValidKeyFormat(key)) {
    throw new PublicAuthError("Invalid API key format", 401);
  }

  const keyHash = hashApiKey(key);

  const result = await db
    .select({
      id: apiKeys.id,
      tenantId: apiKeys.tenantId,
      name: apiKeys.name,
      isActive: apiKeys.isActive,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (result.length === 0) {
    throw new PublicAuthError("Invalid API key", 401);
  }

  const keyRecord = result[0];

  if (!keyRecord.isActive) {
    throw new PublicAuthError("API key is disabled", 403);
  }

  // Update last used timestamp (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: sql`now()` })
    .where(eq(apiKeys.id, keyRecord.id))
    .catch(() => {}); // Non-critical, ignore errors

  return {
    tenantId: keyRecord.tenantId,
    apiKeyId: keyRecord.id,
    keyName: keyRecord.name,
  };
}