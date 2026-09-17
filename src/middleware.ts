import { NextRequest, NextResponse } from "next/server";

// Issue #4: Server-side route protection
const PROTECTED_ROUTES = ["/dashboard", "/documents", "/analytics", "/settings"];
const ADMIN_ROUTES = ["/admin"];
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ai_reviewer_jwt")?.value;

  // If user is already logged in with a real account, redirect away from /login and /signup
  if (token && (pathname === "/login" || pathname === "/signup")) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const json =
          typeof atob === "function"
            ? atob(padded)
            : Buffer.from(padded, "base64").toString("utf-8");
        const payload = JSON.parse(json);
        if (
          payload?.userId &&
          payload?.email &&
          !payload.email.toLowerCase().includes("@aireviewer.local") &&
          payload.userId !== "usr_guest_pending"
        ) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch {
      // Continue to login page if token parse fails
    }
  }

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

    // Strictly restrict /admin to verified admin accounts
    if (isAdmin) {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const json =
          typeof atob === "function"
            ? atob(padded)
            : Buffer.from(padded, "base64").toString("utf-8");
        const payload = JSON.parse(json);

        const isSuperAdmin =
          payload?.role === "admin" ||
          payload?.email?.toLowerCase() === "javedkhan7786king@gmail.com";

        if (!isSuperAdmin) {
          // Deny access for normal users, redirect directly to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/dashboard", request.url));
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
