import { registerEvaluationModule, markModulesRegistered, areModulesRegistered } from "@/services/evaluation/registry";
import { CodeQualityModule } from "./code-quality";
import { SecurityModule } from "./security-module";
import { ProblemAlignmentModule } from "./problem-alignment";
import { EfficiencyModule } from "./efficiency";
import { TestingModule } from "./testing";
import { AccessibilityModule } from "./accessibility";
import { GoogleServicesModule } from "./google-services";

export function registerAllEvaluationModules(): void {
  if (areModulesRegistered()) return;
  registerEvaluationModule(new CodeQualityModule());
  registerEvaluationModule(new SecurityModule());
  registerEvaluationModule(new ProblemAlignmentModule());
  registerEvaluationModule(new EfficiencyModule());
  registerEvaluationModule(new TestingModule());
  registerEvaluationModule(new AccessibilityModule());
  registerEvaluationModule(new GoogleServicesModule());
  markModulesRegistered();
}

export {
  CodeQualityModule, SecurityModule, ProblemAlignmentModule,
  EfficiencyModule, TestingModule, AccessibilityModule, GoogleServicesModule,
};
