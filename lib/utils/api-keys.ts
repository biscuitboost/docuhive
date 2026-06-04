/**
 * API key generation, hashing, and validation for DocuHive Public API.
 *
 * Key format: dhv1_<random_bytes_base62> (28 chars prefix + payload)
 * Keys are stored as SHA-256 hashes — plaintext is only shown once on creation.
 */

import { randomBytes } from "crypto";
import { createHash } from "crypto";

const KEY_PREFIX = "dhv1_";
const KEY_PAYLOAD_BYTES = 20; // 160 bits → ~27 base62 chars

// Base62 alphabet (no ambiguous chars: 0/O, 1/I/l)
const BASE62 =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function base62Encode(bytes: Buffer): string {
  let value = BigInt(0);
  for (const b of bytes) {
    value = (value << BigInt(8)) + BigInt(b);
  }

  let result = "";
  const base = BigInt(62);
  while (value > BigInt(0)) {
    const rem = Number(value % base);
    result = BASE62[rem] + result;
    value = value / base;
  }

  // Pad to expected length
  const expectedLen = Math.ceil((KEY_PAYLOAD_BYTES * 8) / Math.log2(62));
  return result.padStart(expectedLen, BASE62[0]);
}

/**
 * Generate a new API key and its hash storage payload.
 * Returns { plaintextKey, keyPrefix, keyHash, lastFour }.
 * The plaintext key should be shown to the user exactly once.
 */
export function generateApiKey(name: string): {
  plaintextKey: string;
  keyPrefix: string;
  keyHash: string;
  lastFour: string;
} {
  const payload = randomBytes(KEY_PAYLOAD_BYTES);
  const encoded = base62Encode(payload);
  const plaintextKey = `${KEY_PREFIX}${encoded}`;
  const keyPrefix = plaintextKey.slice(0, 8);
  const lastFour = plaintextKey.slice(-4);
  const keyHash = hashApiKey(plaintextKey);

  return { plaintextKey, keyPrefix, keyHash, lastFour };
}

/**
 * Hash an API key for storage (SHA-256).
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key format (must start with dhv1_ and be reasonable length).
 */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length > 28 && key.length < 64;
}

/**
 * Redact an API key for display (show prefix + last four).
 */
export function redactApiKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}