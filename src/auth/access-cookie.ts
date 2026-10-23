import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "jd_access";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Versioned so a format change invalidates old cookies. */
const PAYLOAD_PREFIX = "v1";

function signature(secret: string, expiresAt: number): string {
  return createHmac("sha256", secret).update(`${PAYLOAD_PREFIX}.${expiresAt}`).digest("base64url");
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Cookie value: expiry (ms since epoch) and its HMAC; it only proves the shared password was entered. */
export function signAccess(secret: string, now: Date): string {
  const expiresAt = now.getTime() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${signature(secret, expiresAt)}`;
}

export function verifyAccess(secret: string, value: string | undefined, now: Date): boolean {
  if (!value || !secret) return false;
  const [rawExpiry, sig, ...rest] = value.split(".");
  if (!rawExpiry || !sig || rest.length > 0 || !/^\d+$/.test(rawExpiry)) return false;
  const expiresAt = Number(rawExpiry);
  return expiresAt > now.getTime() && equal(sig, signature(secret, expiresAt));
}

/** Constant-time comparison of the shared password; hashing first evens out the lengths. */
export function isAccessPassword(candidate: string, expected: string): boolean {
  if (!expected) return false;
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}
