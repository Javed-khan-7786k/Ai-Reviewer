import { inngest } from "@/inngest/client";
import { executeWakeupPing, getWakeupConfig } from "@/lib/wakeup";

export const dailyWakeupFunction = inngest.createFunction(
  {
    id: "daily-service-wakeup",
    name: "Daily Video Automation Studio Wakeup (5 AM IST)",
    triggers: [{ cron: "30 23 * * *" }], // Daily at 5:00 AM IST (23:30 UTC previous day)
  },
  async ({ step }: any) => {
    const config = await getWakeupConfig();
    if (!config.enabled) {
      return { skipped: true, reason: "Wakeup scheduler is disabled in Admin." };
    }

    const result = await step.run("ping-service-until-200", async () => {
      return executeWakeupPing();
    });

    return result;
  }
);
