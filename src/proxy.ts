import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, isAccessValid } from "@/auth/access";
import { CLIENT_COOKIE, CLIENT_COOKIE_MAX_AGE_SECONDS, parseClientId } from "@/auth/client-id";
import { API_PREFIX, isPublicPath, LOGIN_PAGE } from "@/auth/public-paths";
import { apiError } from "@/server/api-errors";

/**
 * Gives the browser its anonymous client id on its first authorised request. The cookie is also added
 * to the forwarded request, so a route handler running in this same request already sees it.
 */
function withClientId(request: NextRequest): NextResponse {
  if (parseClientId(request.cookies.get(CLIENT_COOKIE)?.value)) return NextResponse.next();
  const id = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("cookie", [request.headers.get("cookie"), `${CLIENT_COOKIE}=${id}`].filter(Boolean).join("; "));
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(CLIENT_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLIENT_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (isAccessValid(request.cookies.get(ACCESS_COOKIE)?.value)) return withClientId(request);

  if (pathname.startsWith(API_PREFIX)) return apiError("unauthorized");
  const login = new URL(LOGIN_PAGE, request.url);
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
