export const runtime = "nodejs";

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { ingestGitHubRepository, ingestZipRepository } from "@/inngest/functions/ingest-repository";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [ingestGitHubRepository, ingestZipRepository],
  serveHost: process.env.NEXT_PUBLIC_APP_URL,
  servePath: "/api/inngest",
});
