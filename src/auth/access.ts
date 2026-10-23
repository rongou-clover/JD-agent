import { ACCESS_COOKIE, verifyAccess } from "./access-cookie";
import { accessEnv } from "./env";

export { ACCESS_COOKIE };

/** True when the access cookie is valid. Checked by the proxy and again by each protected route. */
export function isAccessValid(cookie: string | undefined, now: Date = new Date()): boolean {
  const env = accessEnv();
  return env !== null && verifyAccess(env.SESSION_SECRET, cookie, now);
}
