/** Reachable without the access cookie. */
export const PUBLIC_PATHS = ["/api/login", "/api/health", "/accesso"] as const;
export const LOGIN_PAGE = "/accesso";
export const API_PREFIX = "/api/";

/** Files served from public/ (e.g. /logo.svg) have an extension; pages do not. Never applies to API routes. */
const STATIC_FILE = /\.[a-z0-9]+$/i;

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname === `${path}/`)) return true;
  return !pathname.startsWith(API_PREFIX) && STATIC_FILE.test(pathname);
}
