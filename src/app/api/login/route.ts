import { cookies } from "next/headers";
import { LoginRequest } from "@/api/contract";
import { ACCESS_COOKIE, ACCESS_COOKIE_MAX_AGE_SECONDS, isAccessPassword, signAccess } from "@/auth/access-cookie";
import { accessEnv } from "@/auth/env";
import { apiError } from "@/server/api-errors";
import { readJson } from "@/server/read-json";

const WRONG_PASSWORD = "Password non corretta.";

export async function POST(request: Request) {
  const parsed = LoginRequest.safeParse(await readJson(request));
  if (!parsed.success) return apiError("invalidRequest");
  const env = accessEnv();
  if (!env) {
    console.error("ACCESS_PASSWORD or SESSION_SECRET is not configured");
    return apiError("internal");
  }
  if (!isAccessPassword(parsed.data.password, env.ACCESS_PASSWORD)) return apiError("unauthorized", WRONG_PASSWORD);

  (await cookies()).set(ACCESS_COOKIE, signAccess(env.SESSION_SECRET, new Date()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return new Response(null, { status: 204 });
}
