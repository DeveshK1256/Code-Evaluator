import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { evaluationOrchestrator } from "@/services/evaluation/evaluation-orchestrator";
import { registerAllEvaluationModules } from "@/services/evaluation/modules";
import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";
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

    registerAllEvaluationModules();

    await repositoryService.updateStatus(repositoryId, "analysis_running", {
      progress: 10,
      statusMessage: "Starting evaluation...",
    });

    logger.info("Starting evaluation", { repositoryId, modules: selectedModules, profileId });

    const result = await evaluationOrchestrator.run({
      repositoryId,
      intelligence: {},
      readme,
      problemStatement,
      selectedModules: selectedModules as import("@/types/evaluation").ModuleId[],
      profileId,
    });

    // Save evaluation results to database
    const supabase = getSupabaseAdminClient();

    const { data: session, error: sessionError } = await supabase
      .from("evaluation_sessions" as never)
      .insert({
        repository_id: repositoryId,
        user_id: userId,
        profile_id: profileId ?? null,
        status: "complete",
        progress: 100,
        selected_modules: selectedModules,
        overall_score: result.session.overallScore,
        overall_grade: result.session.overallGrade,
        overall_confidence: result.session.overallConfidence,
        completed_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (sessionError) throw sessionError;
    const sessionId = (session as Record<string, unknown>).id as string;

    // Save module results
    for (const modResult of result.moduleResults) {
      const { error: modError } = await supabase
        .from("module_results" as never)
        .insert({
          session_id: sessionId,
          module_id: modResult.moduleId,
          module_name: modResult.moduleName,
          score: modResult.score,
          grade: modResult.grade,
          confidence: modResult.confidence,
          confidence_value: modResult.confidenceValue,
          summary: modResult.summary,
          strengths: JSON.parse(JSON.stringify(modResult.strengths)),
          weaknesses: JSON.parse(JSON.stringify(modResult.weaknesses)),
          risks: JSON.parse(JSON.stringify(modResult.risks)),
          missing_practices: modResult.missingPractices,
          evidence: JSON.parse(JSON.stringify(modResult.evidence)),
          recommendations: JSON.parse(JSON.stringify(modResult.recommendations)),
          evaluated_at: modResult.evaluatedAt,
        } as never);

      if (modError) logger.error("Failed to save module result", { moduleId: modResult.moduleId, error: modError });
    }

    // Save recommendations
    for (const rec of result.recommendations) {
      const { error: recError } = await supabase
        .from("recommendations" as never)
        .insert({
          session_id: sessionId,
          module_id: rec.moduleId,
          title: rec.title,
          description: rec.description,
          severity: rec.severity,
          confidence: rec.confidence,
          suggested_fix: rec.suggestedFix,
          estimated_effort: rec.estimatedEffort,
          expected_improvement: rec.expectedScoreImprovement,
          priority: rec.priority,
          roadmap_phase: rec.roadmapPhase,
        } as never);

      if (recError) logger.error("Failed to save recommendation", { title: rec.title, error: recError });
    }

    await repositoryService.updateStatus(repositoryId, "evaluation_complete", {
      progress: 100,
      statusMessage: "Evaluation complete",
    });

    logger.info("Evaluation complete", {
      repositoryId,
      sessionId,
      overallScore: result.session.overallScore,
      moduleCount: result.moduleResults.length,
      recommendations: result.recommendations.length,
    });

    return apiSuccess({
      sessionId,
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
