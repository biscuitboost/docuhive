// ── API Key Utility Tests ────────────────────────────────────────
// Tests for lib/utils/api-keys.ts: generation, hashing, validation

import {
  generateApiKey,
  hashApiKey,
  isValidKeyFormat,
  redactApiKey,
} from "@/lib/utils/api-keys";

describe("generateApiKey", () => {
  it("generates a key with the correct prefix", () => {
    const result = generateApiKey("Test Key");
    expect(result.plaintextKey).toMatch(/^dhv1_/);
  });

  it("generates a key of sufficient length", () => {
    const result = generateApiKey("Test Key");
    expect(result.plaintextKey.length).toBeGreaterThan(30);
  });

  it("returns a 64-char hex hash", () => {
    const result = generateApiKey("Test Key");
    expect(result.keyHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns lastFour matching the end of the key", () => {
    const result = generateApiKey("Test Key");
    expect(result.plaintextKey.endsWith(result.lastFour)).toBe(true);
  });

  it("returns keyPrefix matching the start of the key", () => {
    const result = generateApiKey("Test Key");
    expect(result.plaintextKey.startsWith(result.keyPrefix)).toBe(true);
  });

  it("generates unique keys on successive calls", () => {
    const a = generateApiKey("Test");
    const b = generateApiKey("Test");
    expect(a.plaintextKey).not.toBe(b.plaintextKey);
    expect(a.keyHash).not.toBe(b.keyHash);
  });
});

describe("hashApiKey", () => {
  it("returns a deterministic SHA-256 hex string", () => {
    const hash1 = hashApiKey("dhv1_testkey123");
    const hash2 = hashApiKey("dhv1_testkey123");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns different hashes for different keys", () => {
    const h1 = hashApiKey("dhv1_key_abc");
    const h2 = hashApiKey("dhv1_key_xyz");
    expect(h1).not.toBe(h2);
  });
});

describe("isValidKeyFormat", () => {
  it("accepts valid dhv1_ keys", () => {
    expect(isValidKeyFormat("dhv1_ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe(true);
  });

  it("rejects keys without prefix", () => {
    expect(isValidKeyFormat("noprefix_ABC")).toBe(false);
  });

  it("rejects keys that are too short", () => {
    expect(isValidKeyFormat("dhv1_short")).toBe(false);
  });

  it("rejects keys that are too long", () => {
    expect(isValidKeyFormat("dhv1_" + "a".repeat(64))).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidKeyFormat("")).toBe(false);
  });
});

describe("redactApiKey", () => {
  it("shows prefix + ellipsis + last four", () => {
    const redacted = redactApiKey("dhv1_ABCDEFGHIJKLMNOPQRSTUVWXYZabcd");
    expect(redacted).toContain("dhv1_AB");
    expect(redacted).toContain("abcd");
    expect(redacted).toContain("...");
  });

  it("handles short keys gracefully", () => {
    expect(redactApiKey("short")).toBe("short");
  });
});