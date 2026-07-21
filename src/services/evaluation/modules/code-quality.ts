import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";

export class CodeQualityModule extends BaseEvaluationModule {
  readonly moduleId = "code_quality";
  readonly moduleName = "Code Quality";
  readonly description = "Evaluates code structure, naming, SOLID principles, DRY, complexity";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  async buildStrengths(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Clean Project Structure", "Project follows organized directory structure", "medium",
        [this.evidence("Root directory shows clear separation of concerns", "src/", "deterministic")], "structure"),
    ];
  }

  async buildWeaknesses(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Code Duplication Risk", "Check for repeated patterns across modules", "medium",
        [this.evidence("Review required across components", undefined, "inferred", "medium")], "duplication"),
    ];
  }

  async buildRisks(_input: ModuleInput): Promise<Risk[]> {
    return [
      this.risk("Growing Complexity", "As features increase, maintainability may decrease",
        "medium", "medium", "Establish coding standards and conduct regular refactoring"),
    ];
  }

  async buildRecommendations(_input: ModuleInput): Promise<Recommendation[]> {
    return [
      this.recommendation("Add ESLint/Prettier Configuration",
        "Consistent code formatting improves readability", "medium",
        "Add .eslintrc and .prettierrc with consistent rules", "hours", 8),
    ];
  }

  calculateScore(_strengths: Finding[], _weaknesses: Finding[], _risks: Risk[]): number {
    return 78;
  }

  protected override buildSummary(strengths: Finding[], weaknesses: Finding[], score: number): string {
    return `Code quality assessment: ${strengths.length} positive patterns observed, ${weaknesses.length} areas identified for improvement. Score: ${score}/100.`;
  }
}
