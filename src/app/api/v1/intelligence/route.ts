import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET() {
  return apiSuccess({
    message: "Intelligence API",
    endpoints: {
      start: "POST /api/v1/intelligence/analyze",
      status: "GET /api/v1/intelligence/[repositoryId]/status",
      summary: "GET /api/v1/intelligence/[repositoryId]/summary",
      architecture: "GET /api/v1/intelligence/[repositoryId]/architecture",
      features: "GET /api/v1/intelligence/[repositoryId]/features",
      knowledgeGraph: "GET /api/v1/intelligence/[repositoryId]/knowledge-graph",
      readme: "GET /api/v1/intelligence/[repositoryId]/readme",
      problemStatement: "GET /api/v1/intelligence/[repositoryId]/problem-statement",
    },
  });
}
