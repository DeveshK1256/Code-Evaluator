import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "code-evaluator",
  name: "Code Evaluator",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
