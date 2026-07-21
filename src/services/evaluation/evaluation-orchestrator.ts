import { getAllEvaluationModules } from "./registry";
import { scoringEngine } from "./scoring-engine";
import { recommendationEngine } from "./recommendation-engine";
import { evidenceEngine } from "./evidence-engine";
import { getProfile, normalizeWeights } from "@/config/evaluation-profiles";
import type {
  ModuleResult, EvaluationSession, EvaluationProfile,
  ModuleId, Recommendation, EvaluationStatus,
} from "@/types/evaluation";

export interface EvaluationInput {
  repositoryId: string;
  intelligence: Record<string, unknown>;
  readme?: string;
  problemStatement?: string;
  selectedModules: ModuleId[];
  profileId?: string;
  customWeights?: Record<ModuleId, number>;
}

export class EvaluationOrchestrator {
  /**
   * Run the full evaluation pipeline.
   */
  async run(input: EvaluationInput): Promise<{
    session: Partial<EvaluationSession>;
    moduleResults: ModuleResult[];
    recommendations: Recommendation[];
    roadmap: ReturnType<typeof recommendationEngine.buildRoadmap>;
  }> {
    const foundProfile = input.profileId ? getProfile(input.profileId) : undefined;
    const profile = foundProfile ?? { id: "custom", name: "Custom", description: "", weights: input.customWeights ?? {}, isDefault: false };

    const weights = normalizeWeights(
      (input.customWeights ?? profile.weights) as Record<string, number>,
      input.selectedModules
    );

    // Run selected modules
    const modules = getAllEvaluationModules().filter((m) =>
      input.selectedModules.includes(m.moduleId)
    );

    const moduleResults: ModuleResult[] = [];

    for (const mod of modules) {
      try {
        const result = await mod.buildResult({
          intelligence: input.intelligence,
          readme: input.readme,
          problemStatement: input.problemStatement,
        });
        moduleResults.push(result);
      } catch (error) {
        console.error(`Module ${mod.moduleId} failed:`, error);
        // Add fallback result
        moduleResults.push({
          moduleId: mod.moduleId,
          moduleName: mod.moduleName,
          score: 0, grade: "F", confidence: "low", confidenceValue: 0,
          summary: `Evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          strengths: [], weaknesses: [], risks: [], missingPractices: [],
          evidence: [], recommendations: [],
          evaluatedAt: new Date().toISOString(),
        });
      }
    }

    // Calculate overall score
    const scored = scoringEngine.calculate(moduleResults, profile as EvaluationProfile, input.selectedModules);

    // Aggregate recommendations
    const recommendations = recommendationEngine.aggregate(moduleResults);
    const roadmap = recommendationEngine.buildRoadmap(recommendations);

    const session: Partial<EvaluationSession> = {
      repositoryId: input.repositoryId,
      profileId: input.profileId,
      status: "complete",
      progress: 100,
      selectedModules: input.selectedModules,
      overallScore: scored.overallScore,
      overallGrade: scored.overallGrade,
      overallConfidence: scored.overallConfidence,
    };

    return { session, moduleResults, recommendations, roadmap };
  }

  /**
   * Validate that the selected modules have enough intelligence data.
   */
  validateInput(input: EvaluationInput): string[] {
    const warnings: string[] = [];
    if (!input.intelligence || Object.keys(input.intelligence).length === 0) {
      warnings.push("Repository intelligence data is empty. Run analysis first.");
    }
    if (input.selectedModules.length === 0) {
      warnings.push("No evaluation modules selected.");
    }
    return warnings;
  }

  /**
   * Get the available module choices.
   */
  getAvailableModules(): Array<{ id: ModuleId; name: string; description: string }> {
    return getAllEvaluationModules().map((m) => ({
      id: m.moduleId,
      name: m.moduleName,
      description: m.description,
    }));
  }
}

export const evaluationOrchestrator = new EvaluationOrchestrator();
