import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "javedkhan7786king@gmail.com";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin
  );
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (error || !code) {
    const errorMsg = error || "No authorization code returned by Google";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, appUrl));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=Google OAuth credentials not configured", appUrl));
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(tokenData.error_description || "Failed to exchange token with Google")}`, appUrl)
      );
    }

    // 2. Fetch real user profile from Google UserInfo API
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userRes.json();
    if (!userRes.ok || !profile.email) {
      return NextResponse.redirect(new URL("/login?error=Failed to retrieve Google profile", appUrl));
    }

    const realEmail = profile.email.trim().toLowerCase();
    const realName = profile.name || profile.given_name || realEmail.split("@")[0];
    const isSuperAdmin = realEmail === SUPER_ADMIN_EMAIL.toLowerCase();

    // 3. Find or create user in MongoDB Atlas
    let user = await db.findUserByEmail(realEmail);
    if (!user) {
      user = await db.createUser({
        name: realName,
        email: realEmail,
        plan: isSuperAdmin ? "pro" : "free",
        role: isSuperAdmin ? "admin" : "user",
      });
    } else {
      // Update name or promote to admin if super admin email
      const updates: any = {};
      if (profile.name && user.name !== profile.name) updates.name = profile.name;
      if (isSuperAdmin && (user.role !== "admin" || user.plan !== "pro")) {
        updates.role = "admin";
        updates.plan = "pro";
      }
      if (Object.keys(updates).length > 0) {
        await db.updateUser(user.id, updates);
        user = (await db.getUser(user.id)) || user;
      }
    }

    const userRole = isSuperAdmin ? "admin" : (user.role || "user");
    const userPlan = isSuperAdmin ? "pro" : user.plan;

    // 4. Sign JWT session
    const token = signJwt({
      userId: user.id,
      email: user.email,
      name: user.name || realName,
      role: userRole,
      plan: userPlan,
    });

    // 5. Create redirect response and set httpOnly session cookie
    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    response.cookies.set("ai_reviewer_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || "Authentication failed")}`, appUrl));
  }
}
