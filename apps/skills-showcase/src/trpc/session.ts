import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** Session lifetime: 24 hours. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Cookie name for the signed admin session token. */
export const SESSION_COOKIE_NAME = 'newsletter_admin_session';

/**
 * Constant-time string comparison. Both inputs are hashed to fixed-length
 * SHA-256 digests first, so the underlying `timingSafeEqual` never sees a
 * length mismatch (which would otherwise throw and leak length via timing).
 */
export function safeSecretEqual(a: string, b: string): boolean {
  const da = createHash('sha256').update(a).digest();
  const db = createHash('sha256').update(b).digest();
  return timingSafeEqual(da, db);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Build an opaque, HMAC-signed session token of the form
 * `v1.${expiresAt}.${nonceHex}.${sigHex}`. The nonce makes each token unique
 * per login (rotation); the signature binds it to the secret and expiry.
 */
export function createSessionToken(secret: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString('hex');
  const payload = `v1.${expiresAt}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Validate a session token: correct `v1` shape, unexpired, and a signature
 * that matches the recomputed HMAC in constant time. Returns `false` for any
 * malformed, tampered, expired, or wrong-secret token. Never throws.
 */
export function verifySessionToken(token: string, secret: string): boolean {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [version, expiresAtRaw, nonce, sig] = parts;
  if (version !== 'v1' || !nonce || !sig) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const payload = `v1.${expiresAtRaw}.${nonce}`;
  const expectedSig = sign(payload, secret);
  // Decode first, then compare BYTE lengths: `Buffer.from(hex)` silently stops
  // at the first non-hex char, so a 64-char non-hex sig would otherwise pass a
  // char-length guard but yield a short buffer and make timingSafeEqual throw.
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}
