export const runtime = "nodejs";

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { ingestGitHubRepository, ingestZipRepository } from "@/inngest/functions/ingest-repository";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ingestGitHubRepository, ingestZipRepository],
});
