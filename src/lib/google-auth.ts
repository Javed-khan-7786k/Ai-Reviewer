import { NextRequest } from "next/server";

/**
 * Dynamically resolves the exact Google OAuth redirect URI matching the incoming request domain.
 * - On Vercel production: https://ai-reviewer-fawn.vercel.app/api/auth/callback/google
 * - On Localhost: http://localhost:3000/api/auth/callback/google
 * - Override via GOOGLE_REDIRECT_URI env var if desired.
 */
export function getGoogleRedirectUri(request: NextRequest): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}/api/auth/callback/google`;
}
