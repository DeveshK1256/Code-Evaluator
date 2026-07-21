import type { Recommendation, ImprovementRoadmap, RoadmapItem, ModuleResult } from "@/types/evaluation";

export class RecommendationEngine {
  /**
   * Aggregate and prioritize recommendations from all modules.
   */
  aggregate(moduleResults: ModuleResult[]): Recommendation[] {
    const all: Recommendation[] = [];
    for (const result of moduleResults) {
      for (const rec of result.recommendations) {
        all.push(rec);
      }
    }
    return all.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Build an improvement roadmap from recommendations.
   */
  buildRoadmap(recommendations: Recommendation[]): ImprovementRoadmap {
    const immediate: RoadmapItem[] = [];
    const nextSprint: RoadmapItem[] = [];
    const future: RoadmapItem[] = [];

    for (const rec of recommendations) {
      const item: RoadmapItem = {
        title: rec.title,
        description: rec.description,
        moduleId: rec.moduleId,
        effort: rec.estimatedEffort,
        expectedImpact: rec.expectedScoreImprovement,
        dependencies: [],
      };

      switch (rec.roadmapPhase) {
        case "immediate": immediate.push(item); break;
        case "next_sprint": nextSprint.push(item); break;
        case "future": future.push(item); break;
      }
    }

    return { immediate, nextSprint, future };
  }

  /**
   * Calculate estimated score improvement for implementing recommendations.
   */
  calculatePotentialImprovement(recommendations: Recommendation[]): { total: number; byModule: Record<string, number> } {
    const byModule: Record<string, number> = {};
    let total = 0;

    for (const rec of recommendations) {
      const moduleKey = rec.moduleId ?? "unknown";
      byModule[moduleKey] = (byModule[moduleKey] ?? 0) + rec.expectedScoreImprovement;
      total += rec.expectedScoreImprovement;
    }

    return { total: Math.min(100, total), byModule };
  }

  /**
   * Group recommendations by severity.
   */
  groupBySeverity(recommendations: Recommendation[]): Record<string, Recommendation[]> {
    const groups: Record<string, Recommendation[]> = {};
    for (const rec of recommendations) {
      if (!groups[rec.severity]) groups[rec.severity] = [];
      groups[rec.severity]!.push(rec);
    }
    return groups;
  }

  /**
   * Group recommendations by module.
   */
  groupByModule(recommendations: Recommendation[]): Record<string, Recommendation[]> {
    const groups: Record<string, Recommendation[]> = {};
    for (const rec of recommendations) {
      const key = rec.moduleId ?? "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(rec);
    }
    return groups;
  }
}

export const recommendationEngine = new RecommendationEngine();
