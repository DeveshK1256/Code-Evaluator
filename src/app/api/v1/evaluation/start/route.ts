import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/utils/errors";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { evaluationOrchestrator } from "@/services/evaluation/evaluation-orchestrator";
import { registerAllEvaluationModules } from "@/services/evaluation/modules";
import { logger } from "@/lib/logger";
import { repositoryService } from "@/services/repository.service";
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
    const user = await getAuthenticatedUser(request);
    const userId = user.id;

    // Register modules before running
    registerAllEvaluationModules();

    // Update status to running
    await repositoryService.updateStatus(repositoryId, "analysis_running", {
      progress: 10,
      statusMessage: "Starting evaluation...",
    });

    // Run evaluation synchronously
    logger.info("Starting evaluation", { repositoryId, modules: selectedModules, profileId });

    const result = await evaluationOrchestrator.run({
      repositoryId,
      intelligence: {},
      readme,
      problemStatement,
      selectedModules: selectedModules as import("@/types/evaluation").ModuleId[],
      profileId,
    });

    // Mark complete
    await repositoryService.updateStatus(repositoryId, "evaluation_complete", {
      progress: 100,
      statusMessage: "Evaluation complete",
    });

    logger.info("Evaluation complete", {
      repositoryId,
      overallScore: result.session.overallScore,
      moduleCount: result.moduleResults.length,
      recommendations: result.recommendations.length,
    });

    return apiSuccess({
      repositoryId,
      status: "complete",
      overallScore: result.session.overallScore,
      overallGrade: result.session.overallGrade,
      moduleCount: result.moduleResults.length,
      recommendations: result.recommendations.length,
    }, 200);
  } catch (error) {
    return apiError(error);
  }
}
