import { Inngest } from "inngest";

// Inngest client configuration
export const inngest = new Inngest({
  id: "ai-reviewer-app",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type DocumentProcessEvent = {
  name: "document/process";
  data: {
    documentId: string;
    userId: string;
  };
};
