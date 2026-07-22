import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  repositoryId: z.string().uuid(),
  readme: z.string().optional(),
  problemStatement: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, readme, problemStatement } = schema.parse(body);
    const user = await getAuthenticatedUser(request);
    const userId = user.id;

    // Queue intelligence analysis
    await inngest.send({
      name: "intelligence/analyze",
      data: {
        repositoryId,
        userId,
        readme,
        problemStatement,
      },
    });

    logger.info("Intelligence analysis queued", { repositoryId });

    return apiSuccess({
      repositoryId,
      status: "queued",
      message: "Intelligence analysis has been queued. Use the status endpoint to track progress.",
    }, 202);
  } catch (error) {
    return apiError(error);
  }
}
