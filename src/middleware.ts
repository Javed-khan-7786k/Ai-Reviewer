import { NextRequest, NextResponse } from "next/server";

// Issue #4: Server-side route protection
const PROTECTED_ROUTES = ["/dashboard", "/documents", "/analytics", "/settings"];
const ADMIN_ROUTES = ["/admin"];
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ai_reviewer_jwt")?.value;

  // Allow public routes and static files
  if (
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtected = PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAdmin = ADMIN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (isProtected || isAdmin) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, decode JWT and check role
    if (isAdmin && token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(
              parts[1].replace(/-/g, "+").replace(/_/g, "/") +
                "=".repeat((4 - (parts[1].length % 4)) % 4),
              "base64"
            ).toString("utf-8")
          );
          if (payload.role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      } catch {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
