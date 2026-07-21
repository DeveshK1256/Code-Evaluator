/**
 * Quality Validation Loop
 *
 * After every evaluation, this service validates the results before presenting them.
 * It verifies evidence, recommendation consistency, confidence appropriateness,
 * and detects contradictions between modules.
 */

import type { ModuleResult, Recommendation, Finding, EvidenceItem } from "@/types/evaluation";

export interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  modulesReEvaluated: string[];
}

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  category: "evidence" | "recommendation" | "confidence" | "consistency" | "contradiction" | "inference";
  message: string;
  moduleId?: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface ValidationWarning {
  message: string;
  moduleId?: string;
  suggestion: string;
}

export class QualityValidator {
  /**
   * Run the full validation loop on evaluation results.
   */
  async validate(moduleResults: ModuleResult[]): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    const modulesReEvaluated: string[] = [];

    // 1. Evidence check: every score must have evidence
    issues.push(...this.checkEvidenceCoverage(moduleResults));

    // 2. Recommendation mapping: every recommendation must map to findings
    issues.push(...this.checkRecommendationMapping(moduleResults));

    // 3. Contradiction detection: detect conflicting findings between modules
    issues.push(...this.detectContradictions(moduleResults));

    // 4. Confidence check: is confidence appropriate for evidence?
    issues.push(...this.checkConfidenceAppropriateness(moduleResults));

    // 5. Inference audit: flag unsupported AI inferences presented as facts
    issues.push(...this.auditInferences(moduleResults));

    // 6. Consistency check: module scores should be internally consistent
    warnings.push(...this.checkConsistency(moduleResults));

    const errorCount = issues.filter((i) => i.severity === "critical" || i.severity === "high").length;
    const valid = errorCount === 0;
    const totalFindings = moduleResults.reduce((s, m) => s + m.strengths.length + m.weaknesses.length, 0);
    const score = valid ? 100 : Math.max(0, 100 - errorCount * 10);

    return { valid, score, issues, warnings, modulesReEvaluated };
  }

  /**
   * Check that every score has supporting evidence.
   */
  private checkEvidenceCoverage(results: ModuleResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const result of results) {
      const allFindings = [...result.strengths, ...result.weaknesses];
      const findingsWithoutEvidence = allFindings.filter(
        (f) => !f.evidence || f.evidence.length === 0
      );

      if (findingsWithoutEvidence.length > 0) {
        issues.push({
          type: "error",
          category: "evidence",
          message: `Module "${result.moduleName}" has ${findingsWithoutEvidence.length} finding(s) without evidence. Every finding must cite evidence.`,
          moduleId: result.moduleId,
          severity: findingsWithoutEvidence.length > 3 ? "critical" : "high",
        });
      }

      // Check if evidence item count is proportional to findings
      const evidenceCount = allFindings.reduce((s, f) => s + (f.evidence?.length ?? 0), 0);
      if (evidenceCount === 0 && allFindings.length > 0) {
        issues.push({
          type: "error",
          category: "evidence",
          message: `Module "${result.moduleName}" has ${allFindings.length} findings but zero evidence items.`,
          moduleId: result.moduleId,
          severity: "critical",
        });
      }
    }

    return issues;
  }

  /**
   * Check that every recommendation maps to one or more findings.
   */
  private checkRecommendationMapping(results: ModuleResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const result of results) {
      for (const rec of result.recommendations) {
        if (!rec.evidence || rec.evidence.length === 0) {
          issues.push({
            type: "warning",
            category: "recommendation",
            message: `Recommendation "${rec.title}" in module "${result.moduleName}" has no supporting evidence.`,
            moduleId: result.moduleId,
            severity: "medium",
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect contradictions between modules.
   */
  private detectContradictions(results: ModuleResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const allStrengths = new Map<string, Set<string>>();
    const allWeaknesses = new Map<string, Set<string>>();

    for (const result of results) {
      for (const s of result.strengths) {
        const key = s.title.toLowerCase();
        if (!allStrengths.has(key)) allStrengths.set(key, new Set());
        allStrengths.get(key)!.add(result.moduleName);
      }
      for (const w of result.weaknesses) {
        const key = w.title.toLowerCase();
        if (!allWeaknesses.has(key)) allWeaknesses.set(key, new Set());
        allWeaknesses.get(key)!.add(result.moduleName);
      }
    }

    // Check if same finding is both a strength and weakness
    for (const [key, strengthModules] of allStrengths) {
      if (allWeaknesses.has(key)) {
        const weaknessModules = allWeaknesses.get(key)!;
        const overlap = [...strengthModules].filter((m) => weaknessModules.has(m));
        if (overlap.length > 0) {
          issues.push({
            type: "warning",
            category: "contradiction",
            message: `Contradictory finding "${key}" appears as both strength and weakness in: ${overlap.join(", ")}`,
            moduleId: overlap[0],
            severity: "medium",
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check that confidence scores are appropriate for available evidence.
   */
  private checkConfidenceAppropriateness(results: ModuleResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const result of results) {
      const allEvidence = [
        ...result.strengths.flatMap((f) => f.evidence ?? []),
        ...result.weaknesses.flatMap((f) => f.evidence ?? []),
      ];

      const deterministicCount = allEvidence.filter((e) => e.type === "deterministic").length;
      const totalEvidence = allEvidence.length;

      // High confidence with little deterministic evidence
      if (result.confidence === "high" && deterministicCount < 2 && totalEvidence < 3) {
        issues.push({
          type: "warning",
          category: "confidence",
          message: `Module "${result.moduleName}" has high confidence (${result.confidenceValue.toFixed(2)}) but only ${deterministicCount} deterministic evidence items out of ${totalEvidence} total.`,
          moduleId: result.moduleId,
          severity: "medium",
        });
      }

      // Low confidence with strong evidence
      if (result.confidence === "low" && deterministicCount >= 3) {
        issues.push({
          type: "warning",
          category: "confidence",
          message: `Module "${result.moduleName}" has low confidence despite ${deterministicCount} deterministic evidence items. Consider raising confidence.`,
          moduleId: result.moduleId,
          severity: "low",
        });
      }
    }

    return issues;
  }

  /**
   * Audit AI inferences presented as deterministic facts.
   */
  private auditInferences(results: ModuleResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const result of results) {
      let inferenceCount = 0;
      let factCount = 0;

      for (const finding of [...result.strengths, ...result.weaknesses]) {
        for (const ev of finding.evidence ?? []) {
          if (ev.type === "inferred") inferenceCount++;
          else if (ev.type === "deterministic") factCount++;
        }
      }

      // Flag modules with mostly inferred evidence
      if (inferenceCount > factCount && factCount > 0) {
        issues.push({
          type: "info",
          category: "inference",
          message: `Module "${result.moduleName}" relies more on AI inferences (${inferenceCount}) than deterministic facts (${factCount}). Consider adding more file-backed evidence.`,
          moduleId: result.moduleId,
          severity: "low",
        });
      }

      // Flag modules with zero deterministic evidence
      if (factCount === 0 && inferenceCount > 0) {
        issues.push({
          type: "warning",
          category: "inference",
          message: `Module "${result.moduleName}" has zero deterministic evidence — all ${inferenceCount} evidence items are AI inferences. Results may be less reliable.`,
          moduleId: result.moduleId,
          severity: "high",
        });
      }
    }

    return issues;
  }

  /**
   * Check internal consistency of module results.
   */
  private checkConsistency(results: ModuleResult[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    for (const result of results) {
      // Score vs findings: if score is high but mostly weaknesses
      if (result.score >= 80 && result.weaknesses.length > result.strengths.length) {
        warnings.push({
          message: `Module "${result.moduleName}" has high score (${result.score}) but more weaknesses (${result.weaknesses.length}) than strengths (${result.strengths.length}).`,
          moduleId: result.moduleId,
          suggestion: "Review score calculation — high scores should be supported by more strengths than weaknesses.",
        });
      }

      // Score vs evidence: if score is high but evidence is sparse
      const totalEvidence = [...result.strengths, ...result.weaknesses]
        .reduce((s, f) => s + (f.evidence?.length ?? 0), 0);

      if (result.score >= 90 && totalEvidence < 3) {
        warnings.push({
          message: `Module "${result.moduleName}" scores ${result.score} but has only ${totalEvidence} evidence items across all findings.`,
          moduleId: result.moduleId,
          suggestion: "Add more evidence to justify high scores.",
        });
      }
    }

    return warnings;
  }
}

export const qualityValidator = new QualityValidator();
