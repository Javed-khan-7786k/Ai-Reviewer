import { inngest } from "@/inngest/client";
import { processDocumentJob } from "@/lib/processing/worker";

export const processDocumentFunction = inngest.createFunction(
  {
    id: "process-document-workflow",
    name: "Process Uploaded Document",
    triggers: [{ event: "document/process" }],
    retries: 2,
  },
  async ({ event, step }: any) => {
    const { documentId, userId } = event.data;

    const result = await step.run("execute-document-processing", async () => {
      return await processDocumentJob(documentId, userId);
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to process document");
    }

    return { status: "completed", documentId };
  }
);
