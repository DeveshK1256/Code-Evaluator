/**
 * Judge Simulation
 *
 * Simulates different evaluation perspectives.
 * Each judge profile has different focus areas and priorities.
 */

import type { ModuleResult } from "@/types/evaluation";
import type { JudgePerspective } from "@/types/maturity";
import { scoringEngine } from "@/services/evaluation/scoring-engine";
import { EVALUATION_PROFILES } from "@/config/evaluation-profiles";

export class JudgeSimulation {
  /**
   * Simulate judge perspectives on evaluation results.
   */
  simulate(moduleResults: ModuleResult[]): JudgePerspective[] {
    const judges: JudgePerspective[] = [
      {
        name: "Google Solution Challenge",
        role: "Judge",
        focusAreas: ["Problem Statement Alignment", "Google Services", "Social Impact", "Innovation"],
        score: this.calculateProfileScore(moduleResults, "google-solution-challenge"),
        topFindings: this.getTopFindings(moduleResults, ["problem_alignment", "google_services"]),
        recommendations: this.getRecommendations(moduleResults, ["problem_alignment", "google_services"]),
        priorityDifferences: ["Problem Alignment weighted 25% (vs 10% balanced)", "Google Services weighted 20% (vs 5% balanced)"],
      },
      {
        name: "Senior Software Architect",
        role: "Architecture Reviewer",
        focusAreas: ["Code Organization", "Design Patterns", "Scalability", "Maintainability"],
        score: this.calculateProfileScore(moduleResults, "enterprise-audit"),
        topFindings: this.getTopFindings(moduleResults, ["architecture", "code_quality", "maintainability"]),
        recommendations: this.getRecommendations(moduleResults, ["architecture", "code_quality", "maintainability"]),
        priorityDifferences: ["Architecture weighted 20% (vs 8% balanced)", "Testing weighted 15% (vs 10% balanced)"],
      },
      {
        name: "Security Auditor",
        role: "Security Reviewer",
        focusAreas: ["Authentication", "Authorization", "Input Validation", "Dependencies"],
        score: this.calculateProfileScore(moduleResults, "security-focused"),
        topFindings: this.getTopFindings(moduleResults, ["security", "dependency_health"]),
        recommendations: this.getRecommendations(moduleResults, ["security", "dependency_health"]),
        priorityDifferences: ["Security weighted 40% (vs 15% balanced)", "Dependency Health weighted 10% (vs 3% balanced)"],
      },
      {
        name: "Accessibility Reviewer",
        role: "A11y Specialist",
        focusAreas: ["WCAG Compliance", "Keyboard Navigation", "Screen Readers", "Color Contrast"],
        score: this.calculateScore(moduleResults, "accessibility"),
        topFindings: this.getTopFindings(moduleResults, ["accessibility"]),
        recommendations: this.getRecommendations(moduleResults, ["accessibility"]),
        priorityDifferences: ["Accessibility is the primary focus area"],
      },
      {
        name: "Technical Recruiter",
        role: "Skills Assessor",
        focusAreas: ["Code Quality", "Testing", "Documentation", "Technology Stack"],
        score: this.calculateAverageScore(moduleResults),
        topFindings: this.getTopFindings(moduleResults, ["code_quality", "testing", "documentation"]),
        recommendations: this.getRecommendations(moduleResults, ["code_quality", "testing", "documentation"]),
        priorityDifferences: ["Focuses on overall engineering quality rather than specific metrics"],
      },
    ];

    return judges;
  }

  private calculateProfileScore(results: ModuleResult[], profileId: string): number {
    const profile = EVALUATION_PROFILES.find((p) => p.id === profileId);
    if (!profile) return 0;

    const selectedModules = results.map((r) => r.moduleId);
    const scored = scoringEngine.calculate(results, profile, selectedModules);
    return scored.overallScore;
  }

  private calculateScore(results: ModuleResult[], moduleId: string): number {
    return results.find((r) => r.moduleId === moduleId)?.score ?? 0;
  }

  private calculateAverageScore(results: ModuleResult[]): number {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  }

  private getTopFindings(results: ModuleResult[], moduleIds: string[]): string[] {
    const findings: string[] = [];
    for (const result of results) {
      if (moduleIds.includes(result.moduleId)) {
        for (const w of result.weaknesses.slice(0, 3)) {
          findings.push(w.title);
        }
      }
    }
    return findings.slice(0, 5);
  }

  private getRecommendations(results: ModuleResult[], moduleIds: string[]): string[] {
    const recs: string[] = [];
    for (const result of results) {
      if (moduleIds.includes(result.moduleId)) {
        for (const r of result.recommendations.slice(0, 2)) {
          recs.push(r.title);
        }
      }
    }
    return recs.slice(0, 5);
  }
}

export const judgeSimulation = new JudgeSimulation();
