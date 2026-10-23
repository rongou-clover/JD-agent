import { describe, expect, it } from "vitest";
import { ACCESS_COOKIE_MAX_AGE_SECONDS, isAccessPassword, signAccess, verifyAccess } from "./access-cookie";
import { isPublicPath } from "./public-paths";

const SECRET = "a".repeat(32);
const NOW = new Date("2026-10-23T10:00:00Z");

describe("access cookie", () => {
  it("verifies a cookie it signed until it expires after 30 days", () => {
    const value = signAccess(SECRET, NOW);
    expect(verifyAccess(SECRET, value, NOW)).toBe(true);
    const almost = new Date(NOW.getTime() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000 - 1);
    expect(verifyAccess(SECRET, value, almost)).toBe(true);
    const expired = new Date(NOW.getTime() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000);
    expect(verifyAccess(SECRET, value, expired)).toBe(false);
  });

  it("rejects another secret, a tampered expiry and malformed values", () => {
    const value = signAccess(SECRET, NOW);
    expect(verifyAccess("b".repeat(32), value, NOW)).toBe(false);
    const [expiry, sig] = value.split(".");
    expect(verifyAccess(SECRET, `${Number(expiry) + 1000}.${sig}`, NOW)).toBe(false);
    for (const bad of [undefined, "", "abc", "1.2.3", `x${expiry}.${sig}`]) expect(verifyAccess(SECRET, bad, NOW)).toBe(false);
  });

  it("compares the shared password", () => {
    expect(isAccessPassword("segreta", "segreta")).toBe(true);
    expect(isAccessPassword("segret", "segreta")).toBe(false);
    expect(isAccessPassword("", "")).toBe(false);
  });
});

describe("public paths", () => {
  it("login, health, the login page and static files are public; API files never", () => {
    for (const path of ["/api/login", "/api/health", "/accesso", "/logo.svg"]) expect(isPublicPath(path)).toBe(true);
    for (const path of ["/", "/chat", "/api/chat", "/api/sessions/x.json", "/accessori"]) expect(isPublicPath(path)).toBe(false);
  });
});
