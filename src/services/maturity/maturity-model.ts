/**
 * Engineering Maturity Model
 *
 * Assesses a repository's maturity across multiple dimensions
 * and maps it to a maturity level.
 */

import type { ModuleResult } from "@/types/evaluation";
import type { MaturityAssessment, MaturityLevel, MaturityDimension, MaturityScores } from "@/types/maturity";

const LEVEL_THRESHOLDS: Record<MaturityLevel, number> = {
  prototype: 20,
  early_mvp: 40,
  production_candidate: 60,
  production_ready: 80,
  enterprise_grade: 95,
};

export class MaturityModel {
  /**
   * Assess maturity from evaluation results.
   */
  assess(moduleResults: ModuleResult[]): MaturityAssessment {
    const scores = this.calculateScores(moduleResults);
    const dimensions = this.buildDimensions(scores, moduleResults);
    const overall = this.overallLevel(scores);

    return {
      overall,
      dimensions,
      scores,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate dimension scores from module results.
   */
  private calculateScores(results: ModuleResult[]): MaturityScores {
    const findModule = (id: string) => results.find((r) => r.moduleId === id);

    return {
      codeOrganization: findModule("code_quality")?.score ?? 50,
      testing: findModule("testing")?.score ?? 50,
      security: findModule("security")?.score ?? 50,
      documentation: findModule("documentation")?.score ?? 50,
      devOps: findModule("devops")?.score ?? 50,
      observability: findModule("logging")?.score ?? 50,
      accessibility: findModule("accessibility")?.score ?? 50,
      performance: findModule("performance")?.score ?? 50,
      aiIntegration: findModule("ai_integration")?.score ?? 50,
    };
  }

  /**
   * Build maturity dimensions with evidence.
   */
  private buildDimensions(scores: MaturityScores, results: ModuleResult[]): MaturityDimension[] {
    const dimensions: MaturityDimension[] = [];

    const config: Array<{ key: keyof MaturityScores; name: string }> = [
      { key: "codeOrganization", name: "Code Organization" },
      { key: "testing", name: "Testing Practices" },
      { key: "security", name: "Security" },
      { key: "documentation", name: "Documentation" },
      { key: "devOps", name: "DevOps" },
      { key: "observability", name: "Observability" },
      { key: "accessibility", name: "Accessibility" },
      { key: "performance", name: "Performance" },
      { key: "aiIntegration", name: "AI Integration" },
    ];

    for (const cfg of config) {
      const score = scores[cfg.key];
      dimensions.push({
        name: cfg.name,
        score,
        level: this.scoreToLevel(score),
        strengths: score >= 70 ? [`${cfg.name} score is ${score}/100 — above average`] : [],
        gaps: score < 70 ? [`${cfg.name} score is ${score}/100 — room for improvement`] : [],
        evidence: [`Module score: ${score}/100`],
      });
    }

    return dimensions;
  }

  /**
   * Calculate overall maturity level.
   */
  private overallLevel(scores: MaturityScores): MaturityLevel {
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    return this.scoreToLevel(avg);
  }

  /**
   * Map numeric score to maturity level.
   */
  scoreToLevel(score: number): MaturityLevel {
    if (score >= 80) return "enterprise_grade";
    if (score >= 60) return "production_ready";
    if (score >= 40) return "production_candidate";
    if (score >= 20) return "early_mvp";
    return "prototype";
  }

  /**
   * Get a human-readable description of a maturity level.
   */
  getLevelDescription(level: MaturityLevel): string {
    switch (level) {
      case "prototype": return "Basic structure, minimal engineering practices. Suitable for early prototyping.";
      case "early_mvp": return "Functional but not production-ready. Core features work but testing, security, and documentation need significant improvement.";
      case "production_candidate": return "Approaching production quality. Major engineering practices are in place but may have gaps in testing, security hardening, or observability.";
      case "production_ready": return "Production quality codebase. Strong engineering practices across most dimensions. Minor improvements recommended.";
      case "enterprise_grade": return "Exceptional engineering quality. Industry-leading practices across all dimensions. Suitable for mission-critical systems.";
    }
  }

  /**
   * Format maturity level for display.
   */
  formatLevel(level: MaturityLevel): string {
    return level.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

export const maturityModel = new MaturityModel();
