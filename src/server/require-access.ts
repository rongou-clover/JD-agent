import { cookies } from "next/headers";
import { ACCESS_COOKIE, isAccessValid } from "@/auth/access";

export async function hasAccess(): Promise<boolean> {
  return isAccessValid((await cookies()).get(ACCESS_COOKIE)?.value);
}
