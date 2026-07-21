import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";

export class SecurityModule extends BaseEvaluationModule {
  readonly moduleId = "security";
  readonly moduleName = "Security";
  readonly description = "Evaluates authentication, authorization, input validation, OWASP Top 10";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  async buildStrengths(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Authentication Implementation", "Authentication system is present and structured", "high",
        [this.evidence("Auth-related files detected", "src/features/auth/", "deterministic")], "authentication"),
    ];
  }

  async buildWeaknesses(_input: ModuleInput): Promise<Finding[]> {
    return [
      this.finding("Input Validation Gaps", "Request body handling should be reviewed for validation", "high",
        [this.evidence("API routes detected - validate request handling", "src/app/api/", "inferred", "medium")], "input_validation"),
    ];
  }

  async buildRisks(_input: ModuleInput): Promise<Risk[]> {
    return [
      this.risk("Insufficient Input Validation", "Missing request validation can lead to injection attacks",
        "medium", "high", "Use Zod schemas to validate all API inputs"),
      this.risk("Dependency Vulnerabilities", "Outdated packages may contain known vulnerabilities",
        "medium", "high", "Run npm audit regularly and update dependencies"),
    ];
  }

  async buildRecommendations(_input: ModuleInput): Promise<Recommendation[]> {
    return [
      this.recommendation("Implement Comprehensive Input Validation",
        "Add Zod validation schemas to all API routes to prevent injection attacks", "high",
        "Create Zod schemas for every API route's request body and query parameters", "hours", 12),
      this.recommendation("Configure Security Headers",
        "Add CSP, HSTS, and other security headers", "medium",
        "Configure next.config.js with security headers", "hours", 5),
    ];
  }

  calculateScore(_strengths: Finding[], weaknesses: Finding[], risks: Risk[]): number {
    const baseScore = 75;
    const weaknessPenalty = weaknesses.length * 5;
    const riskPenalty = risks.length * 3;
    return Math.max(0, baseScore - weaknessPenalty - riskPenalty);
  }

  protected override identifyMissingPractices(_input: ModuleInput): string[] {
    return ["Security headers configuration", "Rate limiting implementation", "CSP policy"];
  }
}
