import type { EvaluationProfile, ModuleId } from "@/types/evaluation";

export const EVALUATION_PROFILES: EvaluationProfile[] = [
  {
    id: "google-solution-challenge",
    name: "Google Solution Challenge",
    description: "Optimized for Google Solution Challenge judging criteria",
    isDefault: true,
    weights: {
      efficiency: 0.05, code_quality: 0.10, security: 0.10, performance: 0.05, testing: 0.10,
      accessibility: 0.10, google_services: 0.20, problem_alignment: 0.25,
      architecture: 0.05, documentation: 0.05,
      maintainability: 0, scalability: 0, technical_debt: 0, dependency_health: 0,
      api_design: 0, database_design: 0, devops: 0,
      error_handling: 0, logging: 0, ai_integration: 0,
      ui_consistency: 0, mobile_responsiveness: 0, seo: 0,
    },
  },
  {
    id: "startup-mvp",
    name: "Startup MVP",
    description: "Optimized for early-stage startup products",
    isDefault: false,
    weights: {
      efficiency: 0.05, code_quality: 0.05, security: 0.10, performance: 0.05, testing: 0.05,
      accessibility: 0.05, google_services: 0.05, problem_alignment: 0.20,
      architecture: 0.15, documentation: 0.05,
      maintainability: 0.15, scalability: 0.10, technical_debt: 0, dependency_health: 0,
      api_design: 0, database_design: 0, devops: 0,
      error_handling: 0, logging: 0, ai_integration: 0,
      ui_consistency: 0, mobile_responsiveness: 0, seo: 0,
    },
  },
  {
    id: "enterprise-audit",
    name: "Enterprise Audit",
    description: "Comprehensive enterprise-grade evaluation",
    isDefault: false,
    weights: {
      efficiency: 0.05, code_quality: 0.05, security: 0.25, performance: 0.10, testing: 0.15,
      accessibility: 0.05, google_services: 0, problem_alignment: 0,
      architecture: 0.15, documentation: 0.05,
      maintainability: 0.05, scalability: 0.10, technical_debt: 0.05, dependency_health: 0.05,
      api_design: 0, database_design: 0, devops: 0.10,
      error_handling: 0, logging: 0, ai_integration: 0,
      ui_consistency: 0, mobile_responsiveness: 0, seo: 0,
    },
  },
  {
    id: "academic-project",
    name: "Academic Project",
    description: "For university and hackathon project evaluation",
    isDefault: false,
    weights: {
      efficiency: 0.05, code_quality: 0.15, security: 0.05, performance: 0.05, testing: 0.10,
      accessibility: 0.05, google_services: 0.05, problem_alignment: 0.25,
      architecture: 0.10, documentation: 0.15,
      maintainability: 0.05, scalability: 0, technical_debt: 0, dependency_health: 0,
      api_design: 0, database_design: 0, devops: 0,
      error_handling: 0, logging: 0, ai_integration: 0,
      ui_consistency: 0, mobile_responsiveness: 0, seo: 0,
    },
  },
  {
    id: "security-focused",
    name: "Security Focused",
    description: "Prioritizes security evaluation above all",
    isDefault: false,
    weights: {
      efficiency: 0.05, code_quality: 0.05, security: 0.40, performance: 0.05, testing: 0.10,
      accessibility: 0.05, google_services: 0, problem_alignment: 0,
      architecture: 0.10, documentation: 0.05,
      maintainability: 0.05, scalability: 0.05, technical_debt: 0.05, dependency_health: 0.10,
      api_design: 0, database_design: 0, devops: 0,
      error_handling: 0, logging: 0, ai_integration: 0,
      ui_consistency: 0, mobile_responsiveness: 0, seo: 0,
    },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Well-rounded evaluation across all dimensions",
    isDefault: false,
    weights: {
      efficiency: 0.05, code_quality: 0.10, security: 0.15, performance: 0.08, testing: 0.10,
      accessibility: 0.08, google_services: 0.05, problem_alignment: 0.10,
      architecture: 0.08, documentation: 0.05,
      maintainability: 0.05, scalability: 0.05, technical_debt: 0.03, dependency_health: 0.03,
      api_design: 0.03, database_design: 0.03, devops: 0.03,
      error_handling: 0.03, logging: 0.02, ai_integration: 0.02,
      ui_consistency: 0.02, mobile_responsiveness: 0.02, seo: 0.02,
    },
  },
];

export function getProfile(id: string): EvaluationProfile | undefined {
  return EVALUATION_PROFILES.find((p) => p.id === id);
}

export function getDefaultProfile(): EvaluationProfile {
  return EVALUATION_PROFILES.find((p) => p.isDefault) ?? EVALUATION_PROFILES[0]!;
}

export function normalizeWeights(weights: Record<string, number>, activeModules: string[]): Record<string, number> {
  const active: Record<string, number> = {};
  let sum = 0;
  for (const mod of activeModules) {
    const w = weights[mod] ?? 0;
    if (w > 0) { active[mod] = w; sum += w; }
  }
  if (sum === 0) return active;
  for (const k of Object.keys(active)) active[k] = Math.round((active[k]! / sum) * 100) / 100;
  return active;
}
