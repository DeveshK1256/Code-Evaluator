/**
 * Developer Scorecard
 *
 * Generates a comprehensive scorecard summarizing overall score,
 * category scores, strengths, weaknesses, maturity level, and progress.
 */

import type { ModuleResult } from "@/types/evaluation";
import type { DeveloperScorecard, MaturityLevel } from "@/types/maturity";
import { scoringEngine } from "@/services/evaluation/scoring-engine";
import { EVALUATION_PROFILES } from "@/config/evaluation-profiles";

export class ScorecardGenerator {
  /**
   * Generate a developer scorecard from evaluation results.
   */
  generate(
    moduleResults: ModuleResult[],
    previousResults?: ModuleResult[]
  ): DeveloperScorecard {
    const profile = EVALUATION_PROFILES.find((p) => p.isDefault) ?? EVALUATION_PROFILES[0]!;
    const selectedModules = moduleResults.map((r) => r.moduleId);
    const scored = scoringEngine.calculate(moduleResults, profile, selectedModules);

    const allFindings = moduleResults.flatMap((r) => [
      ...r.strengths.map((f) => ({ ...f, type: "strength" as const })),
      ...r.weaknesses.map((f) => ({ ...f, type: "weakness" as const })),
    ]);

    const strengths = allFindings
      .filter((f) => f.type === "strength")
      .slice(0, 5)
      .map((f) => f.title);

    const weaknesses = allFindings
      .filter((f) => f.type === "weakness")
      .slice(0, 5)
      .map((f) => f.title);

    const highImpactImprovements = moduleResults
      .flatMap((r) => r.recommendations)
      .sort((a, b) => b.expectedScoreImprovement - a.expectedScoreImprovement)
      .slice(0, 5)
      .map((r) => r.title);

    const categoryScores: Record<string, number> = {};
    for (const r of moduleResults) {
      categoryScores[r.moduleName] = r.score;
    }

    // Calculate maturity level
    const avgScore = scored.overallScore;
    const maturityLevel = this.scoreToMaturity(avgScore);

    // Calculate progress
    let progress: { score: number; direction: "up" | "down" | "stable" } | undefined;
    if (previousResults) {
      const prevAvg = previousResults.reduce((s, r) => s + r.score, 0) / previousResults.length;
      const diff = scored.overallScore - prevAvg;
      progress = {
        score: Math.round(diff * 10) / 10,
        direction: diff > 1 ? "up" : diff < -1 ? "down" : "stable",
      };
    }

    return {
      overallScore: scored.overallScore,
      overallGrade: scored.overallGrade,
      maturityLevel,
      categoryScores,
      strengths,
      weaknesses,
      highImpactImprovements,
      progressSinceLastAnalysis: progress,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export scorecard as markdown.
   */
  toMarkdown(card: DeveloperScorecard): string {
    let md = `# Developer Scorecard\n\n`;
    md += `**Overall Score:** ${card.overallScore}/100 (${card.overallGrade})\n`;
    md += `**Maturity Level:** ${card.maturityLevel.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}\n`;

    if (card.progressSinceLastAnalysis) {
      const p = card.progressSinceLastAnalysis;
      const arrow = p.direction === "up" ? "📈" : p.direction === "down" ? "📉" : "➡️";
      md += `**Progress:** ${arrow} ${p.score > 0 ? "+" : ""}${p.score} points\n`;
    }

    md += `\n## Category Scores\n\n`;
    md += `| Category | Score |\n|----------|------|\n`;
    for (const [name, score] of Object.entries(card.categoryScores)) {
      md += `| ${name} | ${score}/100 |\n`;
    }

    md += `\n## Key Strengths\n\n`;
    for (const s of card.strengths) md += `- ✅ ${s}\n`;

    md += `\n## Areas for Improvement\n\n`;
    for (const w of card.weaknesses) md += `- ⚠️ ${w}\n`;

    md += `\n## High-Impact Improvements\n\n`;
    for (const r of card.highImpactImprovements) md += `- 🎯 ${r}\n`;

    return md;
  }

  private scoreToMaturity(score: number): MaturityLevel {
    if (score >= 80) return "enterprise_grade";
    if (score >= 60) return "production_ready";
    if (score >= 40) return "production_candidate";
    if (score >= 20) return "early_mvp";
    return "prototype";
  }
}

export const scorecardGenerator = new ScorecardGenerator();
