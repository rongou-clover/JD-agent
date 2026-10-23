import { cookies } from "next/headers";
import { CLIENT_COOKIE, parseClientId } from "@/auth/client-id";

/** Set by the proxy on every authorised request, so it is present unless the cookie was tampered with. */
export async function currentClientId(): Promise<string | null> {
  return parseClientId((await cookies()).get(CLIENT_COOKIE)?.value);
}
