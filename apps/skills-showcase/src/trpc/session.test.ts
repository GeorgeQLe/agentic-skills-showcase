import { describe, it, expect, afterEach, vi } from "vitest";
import {
  SESSION_TTL_MS,
  SESSION_COOKIE_NAME,
  safeSecretEqual,
  createSessionToken,
  verifySessionToken,
} from "./session";

describe("session", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constants", () => {
    it("exposes a 24h TTL and the cookie name", () => {
      expect(SESSION_TTL_MS).toBe(24 * 60 * 60 * 1000);
      expect(SESSION_COOKIE_NAME).toBe("newsletter_admin_session");
    });
  });

  describe("safeSecretEqual", () => {
    it("is true for equal strings", () => {
      expect(safeSecretEqual("test-secret", "test-secret")).toBe(true);
    });

    it("is false for unequal strings of the same length", () => {
      expect(safeSecretEqual("test-secret", "test-secrXt")).toBe(false);
    });

    it("is false for strings of differing lengths (no throw)", () => {
      expect(safeSecretEqual("short", "a-much-longer-secret")).toBe(false);
    });

    it("is true for two empty strings", () => {
      expect(safeSecretEqual("", "")).toBe(true);
    });
  });

  describe("createSessionToken / verifySessionToken", () => {
    const SECRET = "test-secret";

    it("signs and verifies a roundtrip token", () => {
      const token = createSessionToken(SECRET);
      expect(token.startsWith("v1.")).toBe(true);
      expect(verifySessionToken(token, SECRET)).toBe(true);
    });

    it("produces a unique token per call (nonce rotation)", () => {
      expect(createSessionToken(SECRET)).not.toBe(createSessionToken(SECRET));
    });

    it("rejects a tampered signature", () => {
      const token = createSessionToken(SECRET);
      const parts = token.split(".");
      // Flip one hex char of the signature.
      const sig = parts[3];
      const flipped = (sig[0] === "0" ? "1" : "0") + sig.slice(1);
      const tampered = [parts[0], parts[1], parts[2], flipped].join(".");
      expect(verifySessionToken(tampered, SECRET)).toBe(false);
    });

    it("rejects verification with the wrong secret", () => {
      const token = createSessionToken(SECRET);
      expect(verifySessionToken(token, "other-secret")).toBe(false);
    });

    it("rejects an expired token", () => {
      const token = createSessionToken(SECRET);
      // Advance time past the TTL.
      vi.spyOn(Date, "now").mockReturnValue(Date.now() + SESSION_TTL_MS + 1000);
      expect(verifySessionToken(token, SECRET)).toBe(false);
    });

    it("rejects malformed tokens", () => {
      expect(verifySessionToken("", SECRET)).toBe(false);
      expect(verifySessionToken("garbage", SECRET)).toBe(false);
      expect(verifySessionToken("v1.123.abc", SECRET)).toBe(false);
      expect(verifySessionToken("v2.123.abc.def", SECRET)).toBe(false);
      expect(verifySessionToken("v1.notanumber.abc.def", SECRET)).toBe(false);
    });

    it("rejects (without throwing) a non-hex signature of valid char length", () => {
      // Build a token whose shape + expiry pass, but the signature is 64
      // non-hex chars — Buffer.from(...,'hex') yields a 0-byte buffer.
      const future = Date.now() + SESSION_TTL_MS;
      const badHexSig = "z".repeat(64);
      const token = `v1.${future}.${"a".repeat(32)}.${badHexSig}`;
      expect(() => verifySessionToken(token, SECRET)).not.toThrow();
      expect(verifySessionToken(token, SECRET)).toBe(false);
      // Mixed valid/invalid hex (truncates mid-string) must also be safe.
      const partialHexSig = "ab" + "z".repeat(62);
      const token2 = `v1.${future}.${"a".repeat(32)}.${partialHexSig}`;
      expect(() => verifySessionToken(token2, SECRET)).not.toThrow();
      expect(verifySessionToken(token2, SECRET)).toBe(false);
    });
  });
});
