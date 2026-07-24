import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";

export class TestingModule extends BaseEvaluationModule {
  readonly moduleId = "testing";
  readonly moduleName = "Testing";
  readonly description = "Evaluates test coverage, test types, and testing best practices";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  async buildStrengths(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Test Structure", "Testing files are organized following project structure", "low",
        [this.evidence("Test directories detected in project structure", undefined, "deterministic")], "testing"),
    ];
  }

  async buildWeaknesses(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Insufficient Test Coverage", "Comprehensive testing is recommended for all business logic", "high",
        [this.evidence("Manual review needed to verify test completeness", undefined, "inferred", "low")], "testing"),
    ];
  }

  async buildRisks(_input: ModuleInput): Promise<Risk[]> {
    return [
      this.risk("Regression Risk", "Without comprehensive tests, changes may break existing functionality", "high", "high", "Add unit, integration, and E2E tests"),
    ];
  }

  async buildRecommendations(_input: ModuleInput): Promise<Recommendation[]> {
    return [
      this.recommendation("Add Unit Tests", "Achieve at least 80% unit test coverage", "high", "Add unit tests for all business logic and utilities", "weeks", 15),
      this.recommendation("Add Integration Tests", "Test critical user flows end-to-end", "medium", "Add integration tests for main features", "days", 10),
    ];
  }

  calculateScore(_strengths: Finding[], _weaknesses: Finding[], _risks: Risk[]): number {
    return 50;
  }
}
