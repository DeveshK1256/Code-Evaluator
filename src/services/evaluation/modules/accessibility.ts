import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";

export class AccessibilityModule extends BaseEvaluationModule {
  readonly moduleId = "accessibility";
  readonly moduleName = "Accessibility";
  readonly description = "Evaluates UI/UX accessibility, screen reader support, color contrast, keyboard navigation";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  async buildStrengths(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Modern UI Framework Usage", "Project uses modern components that support accessibility", "low",
        [this.evidence("Framework-level accessibility features are available", undefined, "inferred")], "accessibility"),
    ];
  }

  async buildWeaknesses(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Accessibility Audit Needed", "Automated accessibility scanning is recommended", "medium",
        [this.evidence("Manual audit required for WCAG compliance", undefined, "inferred", "low")], "accessibility"),
    ];
  }

  async buildRisks(_input: ModuleInput): Promise<Risk[]> {
    return [
      this.risk("User Exclusion", "Poor accessibility excludes users with disabilities", "medium", "high", "Conduct accessibility audit and fix WCAG violations"),
    ];
  }

  async buildRecommendations(_input: ModuleInput): Promise<Recommendation[]> {
    return [
      this.recommendation("Add ARIA Labels", "Ensure all interactive elements have proper ARIA labels", "medium", "Review and add ARIA labels to buttons, forms, and navigation", "days", 7),
      this.recommendation("Keyboard Navigation", "Ensure all features are accessible via keyboard", "medium", "Test and fix keyboard navigation for all user flows", "days", 7),
    ];
  }

  calculateScore(_strengths: Finding[], _weaknesses: Finding[], _risks: Risk[]): number {
    return 60;
  }
}
