import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, isAccessValid } from "@/auth/access";
import { API_PREFIX, isPublicPath, LOGIN_PAGE } from "@/auth/public-paths";
import { apiError } from "@/server/api-errors";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (isAccessValid(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith(API_PREFIX)) return apiError("unauthorized");
  const login = new URL(LOGIN_PAGE, request.url);
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
