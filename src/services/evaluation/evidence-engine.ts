import type { EvidenceItem, ConfidenceLabel, Finding, Recommendation } from "@/types/evaluation";

export class EvidenceEngine {
  /**
   * Validate that a finding has sufficient evidence.
   */
  validateFinding(finding: Finding): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!finding.title) issues.push("Finding must have a title");
    if (!finding.description) issues.push("Finding must have a description");
    if (!finding.evidence || finding.evidence.length === 0) {
      issues.push("Finding must have at least one piece of evidence");
    }
    if (!finding.category) issues.push("Finding must have a category");

    return { valid: issues.length === 0, issues };
  }

  /**
   * Calculate confidence from a set of evidence items.
   */
  calculateConfidence(evidence: EvidenceItem[]): { label: ConfidenceLabel; value: number } {
    if (evidence.length === 0) return { label: "low", value: 0.2 };

    let score = 0;
    let totalWeight = 0;

    for (const item of evidence) {
      const weight = item.type === "deterministic" ? 1.0 : 0.5;
      const confMultiplier = this.confidenceMultiplier(item.confidence);
      score += weight * confMultiplier;
      totalWeight += weight;
    }

    const avg = totalWeight > 0 ? score / totalWeight : 0;

    if (avg >= 0.8) return { label: "high", value: Math.round(avg * 100) / 100 };
    if (avg >= 0.5) return { label: "medium", value: Math.round(avg * 100) / 100 };
    return { label: "low", value: Math.round(avg * 100) / 100 };
  }

  /**
   * Calculate confidence for a recommendation based on its evidence.
   */
  calculateRecommendationConfidence(rec: Recommendation): ConfidenceLabel {
    if (!rec.evidence || rec.evidence.length === 0) return "low";

    const hasDeterministic = rec.evidence.some((e) => e.type === "deterministic");
    const hasFileReference = rec.evidence.some((e) => !!e.filePath);

    if (hasDeterministic && hasFileReference) return "high";
    if (hasDeterministic || hasFileReference) return "medium";
    return "low";
  }

  /**
   * Score the quality of evidence.
   */
  scoreEvidenceQuality(evidence: EvidenceItem[]): { score: number; maxScore: number } {
    let score = 0;
    const maxScore = evidence.length * 3;

    for (const item of evidence) {
      if (item.filePath) score += 1;
      if (item.lineNumber) score += 1;
      if (item.type === "deterministic") score += 1;
      else score += 0.5;
    }

    return { score, maxScore };
  }

  /**
   * Ensure every module result has evidence for scores.
   */
  validateModuleHasEvidence(
    strengths: Finding[],
    weaknesses: Finding[]
  ): { valid: boolean; missingCount: number } {
    const allFindings = [...strengths, ...weaknesses];
    const missing = allFindings.filter((f) => !f.evidence || f.evidence.length === 0);
    return { valid: missing.length === 0, missingCount: missing.length };
  }

  private confidenceMultiplier(label: ConfidenceLabel): number {
    switch (label) {
      case "high": return 1.0;
      case "medium": return 0.7;
      case "low": return 0.4;
    }
  }
}

export const evidenceEngine = new EvidenceEngine();
