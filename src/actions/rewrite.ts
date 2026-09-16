"use server";

import { db } from "@/lib/db";
import { rewriteParagraphText } from "@/lib/ai";
import { RewriteTone, RewriteResponse } from "@/types";
import { getCurrentUserAction } from "@/actions/auth";
import { getAdminConfig } from "@/lib/admin";

export interface RewriteActionResult {
  success: boolean;
  result?: RewriteResponse;
  error?: string;
}

export async function rewriteParagraphAction(
  paragraphText: string,
  tone: RewriteTone
): Promise<RewriteActionResult> {
  try {
    if (!paragraphText || paragraphText.trim().length === 0) {
      return { success: false, error: "Paragraph text cannot be empty." };
    }

    const config = getAdminConfig();
    const user = await getCurrentUserAction();
    const usage = await db.getUserUsageToday(user.id);

    const isPro = user.plan === "pro";
    const isUnlimited = config.fullAppFree;
    const maxRewrites = isPro
      ? config.rateLimits.maxDailyRewritesPro
      : config.rateLimits.maxDailyRewritesFree;

    if (!isUnlimited && usage.rewriteRequests >= maxRewrites) {
      return {
        success: false,
        error: `Daily rewrite limit reached (${usage.rewriteRequests}/${maxRewrites} rewrites used today). ${
          !isPro ? "Upgrade to Pro for more rewrites or try again tomorrow." : "Daily Pro limit reached."
        }`,
      };
    }

    const result = await rewriteParagraphText(paragraphText, tone);
    await db.incrementUserUsage(user.id, "rewrite");

    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to generate rewrite suggestion.",
    };
  }
}
