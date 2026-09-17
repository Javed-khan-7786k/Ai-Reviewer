import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.nextUrl.origin
  );

  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId) {
    // If GOOGLE_CLIENT_ID is not configured yet, show clear instructions
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Google OAuth Setup Required</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; max-width: 540px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            h2 { font-size: 20px; color: #0f172a; margin-top: 0; }
            p { font-size: 14px; line-height: 1.6; color: #475569; }
            code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-size: 13px; color: #0f172a; }
            ol { font-size: 13px; line-height: 1.8; color: #334155; padding-left: 20px; }
            .btn { display: inline-block; margin-top: 16px; background: #2563eb; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🔑 Google OAuth Keys Required</h2>
            <p>To enable real Google Sign-In with real Google accounts, please set your Google Cloud credentials:</p>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a>.</li>
              <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
              <li>Add Authorized redirect URI: <code>${redirectUri}</code></li>
              <li>Add these environment variables to your <strong>.env.local</strong> and <strong>Vercel Dashboard</strong>:
                <br/><br/>
                <code>GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</code><br/>
                <code>GOOGLE_CLIENT_SECRET=your_client_secret</code>
              </li>
            </ol>
            <a href="/login" class="btn">&larr; Return to Sign In</a>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Construct Google OAuth 2.0 authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(googleAuthUrl.toString());
}
