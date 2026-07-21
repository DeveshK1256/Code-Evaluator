import type { ModuleResult, EvaluationProfile, ModuleId, ScoringConfig, GradeThreshold } from "@/types/evaluation";
import { normalizeWeights } from "@/config/evaluation-profiles";

export class ScoringEngine {
  private defaultThresholds: GradeThreshold[] = [
    { grade: "A+", minScore: 97, label: "Exceptional" },
    { grade: "A", minScore: 93, label: "Excellent" },
    { grade: "A-", minScore: 90, label: "Very Good" },
    { grade: "B+", minScore: 87, label: "Good" },
    { grade: "B", minScore: 83, label: "Satisfactory" },
    { grade: "B-", minScore: 80, label: "Adequate" },
    { grade: "C+", minScore: 77, label: "Below Average" },
    { grade: "C", minScore: 73, label: "Poor" },
    { grade: "C-", minScore: 70, label: "Very Poor" },
    { grade: "D", minScore: 60, label: "Unacceptable" },
    { grade: "F", minScore: 0, label: "Failing" },
  ];

  /**
   * Calculate overall score from module results using weighted profile.
   */
  calculate(
    moduleResults: ModuleResult[],
    profile: EvaluationProfile,
    selectedModules: ModuleId[]
  ): {
    overallScore: number;
    overallGrade: string;
    overallConfidence: number;
    moduleScores: Array<{ moduleId: ModuleId; score: number; weight: number; weightedScore: number }>;
  } {
    const weights = normalizeWeights(profile.weights as Record<string, number>, selectedModules);

    let totalWeightedScore = 0;
    let totalConfidenceWeighted = 0;
    let totalWeight = 0;
    const moduleScores: Array<{ moduleId: ModuleId; score: number; weight: number; weightedScore: number }> = [];

    for (const result of moduleResults) {
      const weight = weights[result.moduleId] ?? 0;
      if (weight === 0) continue;

      const weightedScore = result.score * weight;
      totalWeightedScore += weightedScore;
      totalConfidenceWeighted += result.confidenceValue * weight;
      totalWeight += weight;

      moduleScores.push({
        moduleId: result.moduleId,
        score: result.score,
        weight,
        weightedScore: Math.round(weightedScore * 10) / 10,
      });
    }

    if (totalWeight === 0) {
      return { overallScore: 0, overallGrade: "F", overallConfidence: 0, moduleScores };
    }

    const overallScore = Math.round((totalWeightedScore / totalWeight) * 10) / 10;
    const overallConfidence = Math.round((totalConfidenceWeighted / totalWeight) * 100) / 100;

    return {
      overallScore,
      overallGrade: this.scoreToGrade(overallScore),
      overallConfidence,
      moduleScores,
    };
  }

  /**
   * Convert numeric score to letter grade.
   */
  scoreToGrade(score: number, thresholds?: GradeThreshold[]): string {
    const grades = thresholds ?? this.defaultThresholds;
    for (const t of grades) {
      if (score >= t.minScore) return t.grade;
    }
    return "F";
  }

  /**
   * Normalize module weights so they sum to 1.0.
   */
  normalizeWeights(weights: Record<string, number>, activeModules: string[]): Record<string, number> {
    return normalizeWeights(weights, activeModules);
  }

  /**
   * Grade label lookup.
   */
  getGradeLabel(grade: string): string {
    return this.defaultThresholds.find((t) => t.grade === grade)?.label ?? "Unknown";
  }
}

export const scoringEngine = new ScoringEngine();
