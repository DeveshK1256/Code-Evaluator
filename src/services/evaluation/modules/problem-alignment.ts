import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";

export class ProblemAlignmentModule extends BaseEvaluationModule {
  readonly moduleId = "problem_alignment";
  readonly moduleName = "Problem Statement Alignment";
  readonly description = "Evaluates how well the implementation matches requirements";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  async buildStrengths(input: ModuleInput): Promise<Finding[]> {
    const strengths: Finding[] = [];
    if (input.intelligence?.summary) {
      strengths.push(this.finding("Clear Project Purpose", "Project has a well-defined purpose and target users", "high",
        [this.evidence("Repository intelligence provides clear project context", undefined, "deterministic")], "requirements"));
    }
    if (input.intelligence?.features && (input.intelligence.features as { features: unknown[] }).features?.length > 0) {
      strengths.push(this.finding("Feature Set Identified", "Multiple features detected matching typical requirements", "high",
        [this.evidence("Features extracted from repository analysis", undefined, "deterministic")], "features"));
    }
    return strengths;
  }

  async buildWeaknesses(input: ModuleInput): Promise<Finding[]> {
    const weaknesses: Finding[] = [];
    if (!input.problemStatement) {
      weaknesses.push(this.finding("No Problem Statement Provided", "Without a problem statement, alignment cannot be fully evaluated", "info",
        [this.evidence("Problem statement field is empty", undefined, "deterministic")], "requirements"));
    }
    return weaknesses;
  }

  async buildRisks(_input: ModuleInput): Promise<Risk[]> {
    return [
      this.risk("Scope Creep Potential", "Without clear requirement tracking, features may drift from original goals",
        "medium", "medium", "Maintain a requirements traceability matrix"),
    ];
  }

  async buildRecommendations(input: ModuleInput): Promise<Recommendation[]> {
    const recs: Recommendation[] = [
      this.recommendation("Upload Problem Statement",
        "Provide a problem statement for accurate alignment scoring", "info",
        "Upload a problem statement document during repository submission", "minutes", 0),
    ];
    if (input.intelligence?.features) {
      recs.push(this.recommendation("Document Feature Requirements",
        "Clearly define expected vs implemented features", "medium",
        "Create a requirements document listing all expected features with priority levels", "hours", 10));
    }
    return recs;
  }

  calculateScore(strengths: Finding[], weaknesses: Finding[], _risks: Risk[]): number {
    const base = 70;
    const strengthBonus = Math.min(strengths.length * 10, 20);
    const weaknessPenalty = weaknesses.length * 15;
    return Math.max(0, Math.min(100, base + strengthBonus - weaknessPenalty));
  }
}
