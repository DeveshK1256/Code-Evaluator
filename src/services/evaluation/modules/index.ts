import { registerEvaluationModule, markModulesRegistered, areModulesRegistered } from "@/services/evaluation/registry";
import { CodeQualityModule } from "./code-quality";
import { SecurityModule } from "./security-module";
import { ProblemAlignmentModule } from "./problem-alignment";

export function registerAllEvaluationModules(): void {
  if (areModulesRegistered()) return;
  registerEvaluationModule(new CodeQualityModule());
  registerEvaluationModule(new SecurityModule());
  registerEvaluationModule(new ProblemAlignmentModule());
  markModulesRegistered();
  // Additional modules: performance, testing, accessibility, google_services,
  // architecture, documentation, maintainability, scalability, technical_debt,
  // dependency_health, api_design, database_design, devops,
  // error_handling, logging, ai_integration, ui_consistency,
  // mobile_responsiveness, seo
}

export { CodeQualityModule, SecurityModule, ProblemAlignmentModule };
