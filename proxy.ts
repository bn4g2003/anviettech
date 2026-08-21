import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "anviet_crm_session";
const PUBLIC_PATHS = ["/dang-nhap", "/api/v1/auth/login", "/api/v1/auth/logout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Bạn cần đăng nhập" } }, { status: 401 });
    const loginUrl = new URL("/dang-nhap", request.url); loginUrl.searchParams.set("next", pathname); return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
