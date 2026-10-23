import { z } from "zod";

/** Anonymous browser id: groups the chats started from one browser. Not a credential, so not signed. */
export const CLIENT_COOKIE = "jd_client";
export const CLIENT_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function parseClientId(value: string | undefined): string | null {
  const parsed = z.uuid().safeParse(value);
  return parsed.success ? parsed.data : null;
}
