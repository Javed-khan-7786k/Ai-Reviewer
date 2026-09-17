import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredGuestData } from "@/lib/cleanup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check optional authorization header if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default: purge guest records older than 7 days
    const result = await cleanupExpiredGuestData(7);

    return NextResponse.json({
      message: "Expired guest data cleanup executed successfully.",
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute cleanup." },
      { status: 500 }
    );
  }
}
