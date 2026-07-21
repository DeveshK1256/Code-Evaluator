import { inngest } from "@/inngest/client";
import { evaluationOrchestrator } from "@/services/evaluation/evaluation-orchestrator";
import { logger } from "@/lib/logger";

export const runEvaluationPipeline = inngest.createFunction(
  { id: "evaluation-pipeline", retries: 1 },
  { event: "evaluation/start" },
  async ({ event, step }) => {
    const { repositoryId, userId, intelligence, readme, problemStatement, selectedModules, profileId } =
      event.data as {
        repositoryId: string;
        userId: string;
        intelligence: Record<string, unknown>;
        readme?: string;
        problemStatement?: string;
        selectedModules: string[];
        profileId?: string;
      };

    const warnings = evaluationOrchestrator.validateInput({
      repositoryId,
      intelligence,
      readme,
      problemStatement,
      selectedModules: selectedModules as never[],
      profileId,
    });

    if (warnings.length > 0) {
      logger.warn("Evaluation warnings", { repositoryId, warnings });
    }

    const result = await step.run("run-modules", async () => {
      return evaluationOrchestrator.run({
        repositoryId,
        intelligence,
        readme,
        problemStatement,
        selectedModules: selectedModules as never[],
        profileId,
      });
    });

    logger.info("Evaluation complete", {
      repositoryId,
      overallScore: result.session.overallScore,
      moduleCount: result.moduleResults.length,
      recommendations: result.recommendations.length,
    });

    return {
      success: true,
      repositoryId,
      overallScore: result.session.overallScore,
      overallGrade: result.session.overallGrade,
      moduleCount: result.moduleResults.length,
      recommendations: result.recommendations.length,
    };
  }
);
