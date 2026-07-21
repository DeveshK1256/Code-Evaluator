import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { evaluationOrchestrator } from "@/services/evaluation/evaluation-orchestrator";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  repositoryId: z.string().min(1),
  profileId: z.string().optional(),
  selectedModules: z.array(z.string()).min(1, "Select at least one module"),
  customWeights: z.record(z.number()).optional(),
  readme: z.string().optional(),
  problemStatement: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, profileId, selectedModules, customWeights, readme, problemStatement } = schema.parse(body);
    const userId = "user-placeholder";

    // Queue background evaluation
    await inngest.send({
      name: "evaluation/start",
      data: {
        repositoryId,
        userId,
        intelligence: {},
        readme,
        problemStatement,
        selectedModules,
        profileId,
      },
    });

    logger.info("Evaluation queued", { repositoryId, modules: selectedModules, profileId });

    return apiSuccess({
      repositoryId,
      status: "queued",
      selectedModules,
      profileId,
      message: "Evaluation has been queued.",
    }, 202);
  } catch (error) {
    return apiError(error);
  }
}
