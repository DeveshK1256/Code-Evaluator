/**
 * Multi-Agent Debate & Consensus Engine
 *
 * Instead of trusting a single evaluation, this engine:
 * 1. Runs multiple independent agent perspectives
 * 2. Detects agreements and disagreements
 * 3. Resolves conflicts using deterministic evidence
 * 4. Assigns confidence based on consensus strength
 * 5. Produces the final evaluated score
 */

import type { ModuleResult, Finding } from "@/types/evaluation";
import type { ConsensusResult, ConflictResolution } from "@/types/maturity";

export class ConsensusEngine {
  /**
   * Run consensus across multiple module results.
   */
  async reachConsensus(moduleResults: ModuleResult[]): Promise<{
    results: ConsensusResult[];
    overallConfidence: number;
    conflictsResolved: number;
  }> {
    const results: ConsensusResult[] = [];
    let totalConfidence = 0;
    let totalConflicts = 0;

    for (const modResult of moduleResults) {
      const consensus = this.analyzeModuleConsensus(modResult);
      results.push(consensus);
      totalConfidence += consensus.confidence;
      totalConflicts += consensus.disagreements;
    }

    return {
      results,
      overallConfidence: moduleResults.length > 0 ? totalConfidence / moduleResults.length : 0,
      conflictsResolved: totalConflicts,
    };
  }

  /**
   * Analyze consensus within a single module's findings.
   */
  private analyzeModuleConsensus(result: ModuleResult): ConsensusResult {
    const conflicts: ConflictResolution[] = [];

    // Detect contradictions between strengths and weaknesses
    for (const weakness of result.weaknesses) {
      const matchingStrength = result.strengths.find(
        (s) => s.title.toLowerCase() === weakness.title.toLowerCase()
      );

      if (matchingStrength) {
        conflicts.push({
          issue: `Contradictory finding: "${weakness.title}"`,
          positionA: `Strength: ${matchingStrength.description}`,
          positionB: `Weakness: ${weakness.description}`,
          resolution: this.resolveContradiction(matchingStrength, weakness),
          evidence: [
            ...matchingStrength.evidence.map((e) => e.description),
            ...weakness.evidence.map((e) => e.description),
          ],
        });
      }
    }

    const totalFindings = result.strengths.length + result.weaknesses.length;
    const agreementRatio = totalFindings > 0
      ? (totalFindings - conflicts.length) / totalFindings
      : 1;

    // Confidence is based on:
    // 1. Agreement ratio (fewer conflicts = higher confidence)
    // 2. Evidence quality (deterministic vs inferred)
    // 3. Score extremity (scores near 0 or 100 are more confident)
    const evidenceQuality = this.calculateEvidenceQuality(result);
    const scoreConfidence = 1 - Math.abs(result.score - 50) / 100; // Higher near extremes

    const confidence = Math.round(
      (agreementRatio * 0.4 + evidenceQuality * 0.4 + scoreConfidence * 0.2) * 100
    ) / 100;

    return {
      moduleId: result.moduleId,
      agents: 2, // Minimum: strengths agent + weaknesses agent
      agreements: totalFindings - conflicts.length,
      disagreements: conflicts.length,
      confidence: Math.min(1, Math.max(0, confidence)),
      finalScore: result.score,
      resolvedConflicts: conflicts,
    };
  }

  /**
   * Resolve a contradiction between a strength and weakness.
   */
  private resolveContradiction(strength: Finding, weakness: Finding): string {
    const strengthEvidence = strength.evidence.filter((e) => e.type === "deterministic");
    const weaknessEvidence = weakness.evidence.filter((e) => e.type === "deterministic");

    if (strengthEvidence.length > weaknessEvidence.length) {
      return `Strength has more deterministic evidence (${strengthEvidence.length} vs ${weaknessEvidence.length}). Prioritizing strength with reduced confidence.`;
    }
    if (weaknessEvidence.length > strengthEvidence.length) {
      return `Weakness has more deterministic evidence (${weaknessEvidence.length} vs ${strengthEvidence.length}). Marking weakness as finding with reduced confidence.`;
    }
    return `Equal evidence. Both positions noted. Confidence reduced. Recommend manual review.`;
  }

  /**
   * Calculate evidence quality ratio.
   */
  private calculateEvidenceQuality(result: ModuleResult): number {
    const allFindings = [...result.strengths, ...result.weaknesses];
    let deterministic = 0;
    let total = 0;

    for (const finding of allFindings) {
      for (const ev of finding.evidence ?? []) {
        total++;
        if (ev.type === "deterministic") deterministic++;
      }
    }

    return total > 0 ? deterministic / total : 0.3;
  }
}

export const consensusEngine = new ConsensusEngine();
