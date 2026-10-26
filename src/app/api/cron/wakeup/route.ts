import { NextRequest, NextResponse } from "next/server";
import { executeWakeupPing, getWakeupConfig } from "@/lib/wakeup";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allows up to 60s for Vercel functions

export async function GET(request: NextRequest) {
  try {
    // Check optional authorization header if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getWakeupConfig();
    if (!config.enabled) {
      return NextResponse.json({
        message: "Wakeup scheduler is currently disabled in Admin settings.",
        enabled: false,
      });
    }

    // Execute the wake-up loop
    const result = await executeWakeupPing();

    return NextResponse.json({
      message: result.success
        ? "Video Automation Studio wake-up completed successfully with 200 OK."
        : "Wake-up ping executed; service did not return 200 within attempt limit.",
      schedule: "Morning 5:00 AM IST (23:30 UTC)",
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute wakeup ping sequence." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
