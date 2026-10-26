import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processDocumentFunction } from "@/inngest/functions/processDocument";
import { dailyWakeupFunction } from "@/inngest/functions/dailyWakeup";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocumentFunction, dailyWakeupFunction],
});
