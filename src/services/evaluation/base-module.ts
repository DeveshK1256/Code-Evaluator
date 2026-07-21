import type { ModuleId, ModuleResult, EvidenceItem, Recommendation, Finding, Risk } from "@/types/evaluation";
import { evidenceEngine } from "./evidence-engine";

export interface ModuleInput {
  intelligence: Record<string, unknown>;
  readme?: string;
  problemStatement?: string;
  files?: Array<{ path: string; content: string }>;
  options?: Record<string, unknown>;
}

export abstract class BaseEvaluationModule {
  abstract readonly moduleId: ModuleId;
  abstract readonly moduleName: string;
  abstract readonly description: string;
  abstract readonly version: string;

  /**
   * Run the module evaluation.
   */
  abstract evaluate(input: ModuleInput): Promise<ModuleResult>;

  /**
   * Build strengths from analysis.
   */
  abstract buildStrengths(input: ModuleInput): Promise<Finding[]>;

  /**
   * Build weaknesses from analysis.
   */
  abstract buildWeaknesses(input: ModuleInput): Promise<Finding[]>;

  /**
   * Build risks from analysis.
   */
  abstract buildRisks(input: ModuleInput): Promise<Risk[]>;

  /**
   * Build recommendations from analysis.
   */
  abstract buildRecommendations(input: ModuleInput): Promise<Recommendation[]>;

  /**
   * Calculate score based on findings.
   * The application computes this, not AI.
   */
  abstract calculateScore(strengths: Finding[], weaknesses: Finding[], risks: Risk[]): number;

  /**
   * Build the final result with validation.
   */
  async buildResult(input: ModuleInput): Promise<ModuleResult> {
    const strengths = await this.buildStrengths(input);
    const weaknesses = await this.buildWeaknesses(input);
    const risks = await this.buildRisks(input);
    const recommendations = await this.buildRecommendations(input);
    const score = this.calculateScore(strengths, weaknesses, risks);

    // Validate evidence
    const evidenceValidation = evidenceEngine.validateModuleHasEvidence(strengths, weaknesses);
    if (evidenceValidation.missingCount > 0) {
      console.warn(`Module ${this.moduleId}: ${evidenceValidation.missingCount} findings lack evidence`);
    }

    // Calculate confidence from all evidence
    const allEvidence: EvidenceItem[] = [
      ...strengths.flatMap((s) => s.evidence),
      ...weaknesses.flatMap((w) => w.evidence),
    ];
    const confidence = evidenceEngine.calculateConfidence(allEvidence);

    return {
      moduleId: this.moduleId,
      moduleName: this.moduleName,
      score,
      grade: this.scoreToGrade(score),
      confidence: confidence.label,
      confidenceValue: confidence.value,
      summary: this.buildSummary(strengths, weaknesses, score),
      strengths,
      weaknesses,
      risks,
      missingPractices: this.identifyMissingPractices(input),
      evidence: allEvidence,
      recommendations,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build a summary from the evaluation.
   */
  protected buildSummary(strengths: Finding[], weaknesses: Finding[], score: number): string {
    const strengthCount = strengths.length;
    const weaknessCount = weaknesses.length;
    return `Found ${strengthCount} strengths and ${weaknessCount} areas for improvement. Score: ${score}/100.`;
  }

  /**
   * Identify missing practices.
   */
  protected identifyMissingPractices(_input: ModuleInput): string[] {
    return [];
  }

  /**
   * Calculate grade from score.
   */
  protected scoreToGrade(score: number): string {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Create an evidence item.
   */
  protected evidence(
    description: string,
    filePath?: string,
    type: "deterministic" | "inferred" = "inferred",
    confidence: "high" | "medium" | "low" = "medium"
  ): EvidenceItem {
    return { description, filePath, type, confidence };
  }

  /**
   * Create a finding (strength or weakness).
   */
  protected finding(
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low" | "info",
    evidence: EvidenceItem[],
    category: string
  ): Finding {
    return { title, description, severity, evidence, category };
  }

  /**
   * Create a recommendation.
   */
  protected recommendation(
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low" | "info",
    suggestedFix: string,
    estimatedEffort: "minutes" | "hours" | "days" | "weeks" = "hours",
    expectedScoreImprovement: number = 5,
    evidence?: EvidenceItem[]
  ): Recommendation {
    return {
      title,
      description,
      moduleId: this.moduleId,
      severity,
      confidence: "medium",
      evidence: evidence ?? [],
      suggestedFix,
      estimatedEffort,
      expectedScoreImprovement,
      priority: severity === "critical" ? 100 : severity === "high" ? 70 : severity === "medium" ? 40 : 15,
      roadmapPhase: severity === "critical" || severity === "high" ? "immediate" : severity === "medium" ? "next_sprint" : "future",
    };
  }

  /**
   * Create a risk.
   */
  protected risk(
    title: string,
    description: string,
    likelihood: "low" | "medium" | "high",
    impact: "low" | "medium" | "high",
    mitigation: string
  ): Risk {
    return { title, description, likelihood, impact, mitigation };
  }
}
