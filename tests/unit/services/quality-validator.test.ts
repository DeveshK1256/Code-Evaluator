import { describe, it, expect } from "vitest";
import { QualityValidator } from "@/services/evaluation/quality-validator";
import type { ModuleResult, Finding, Recommendation, ModuleId } from "@/types/evaluation";

const validator = new QualityValidator();

function createMockResult(overrides: Partial<ModuleResult> = {}): ModuleResult {
  return {
    moduleId: "code_quality" as ModuleId,
    moduleName: "Test Module",
    score: 75,
    grade: "B",
    confidence: "medium",
    confidenceValue: 0.65,
    summary: "Test summary",
    strengths: [],
    weaknesses: [],
    risks: [],
    missingPractices: [],
    evidence: [],
    recommendations: [],
    evaluatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createFinding(title: string, evidence: Array<{ type: "deterministic" | "inferred" }>): Finding {
  return {
    title,
    description: `Description for ${title}`,
    severity: "medium",
    evidence: evidence.map((e) => ({
      description: `Evidence for ${title}`,
      type: e.type,
      confidence: "medium" as const,
    })),
    category: "test",
  };
}

describe("QualityValidator", () => {
  describe("checkEvidenceCoverage", () => {
    it("passes when all findings have evidence", async () => {
      const result = createMockResult({
        strengths: [createFinding("Good structure", [{ type: "deterministic" }])],
        weaknesses: [createFinding("Minor issue", [{ type: "inferred" }])],
      });

      const validation = await validator.validate([result]);
      const evidenceIssues = validation.issues.filter((i) => i.category === "evidence");
      expect(evidenceIssues.length).toBe(0);
    });

    it("fails when findings lack evidence", async () => {
      const result = createMockResult({
        strengths: [{ title: "No evidence", description: "Missing", severity: "medium" as const, evidence: [], category: "test" }],
      });

      const validation = await validator.validate([result]);
      const evidenceIssues = validation.issues.filter((i) => i.category === "evidence");
      expect(evidenceIssues.length).toBeGreaterThan(0);
      expect(evidenceIssues[0]?.severity).toBe("high");
    });

    it("fails critically when zero evidence across all findings", async () => {
      const result = createMockResult({
        strengths: [
          { title: "S1", description: "D1", severity: "medium" as const, evidence: [], category: "test" },
          { title: "S2", description: "D2", severity: "medium" as const, evidence: [], category: "test" },
        ],
      });

      const validation = await validator.validate([result]);
      const criticalIssues = validation.issues.filter((i) => i.severity === "critical");
      expect(criticalIssues.length).toBeGreaterThan(0);
    });
  });

  describe("checkRecommendationMapping", () => {
    it("passes when recommendations have evidence", async () => {
      const result = createMockResult({
        recommendations: [{
          title: "Fix issue", description: "Fix it", moduleId: "code_quality" as ModuleId,
          severity: "high" as const, confidence: "medium" as const,
          evidence: [{ description: "Evidence", type: "deterministic" as const, confidence: "medium" as const }],
          suggestedFix: "Do X", estimatedEffort: "hours" as const,
          expectedScoreImprovement: 5, priority: 70, roadmapPhase: "immediate" as const,
        }],
      });

      const validation = await validator.validate([result]);
      const recIssues = validation.issues.filter((i) => i.category === "recommendation");
      expect(recIssues.length).toBe(0);
    });

    it("warns when recommendations lack evidence", async () => {
      const result = createMockResult({
        recommendations: [{
          title: "No evidence rec", description: "Fix it", moduleId: "code_quality" as ModuleId,
          severity: "high" as const, confidence: "medium" as const,
          evidence: [], suggestedFix: "Do X", estimatedEffort: "hours" as const,
          expectedScoreImprovement: 5, priority: 70, roadmapPhase: "immediate" as const,
        }],
      });

      const validation = await validator.validate([result]);
      const recIssues = validation.issues.filter((i) => i.category === "recommendation");
      expect(recIssues.length).toBeGreaterThan(0);
    });
  });

  describe("detectContradictions", () => {
    it("detects when same finding appears as both strength and weakness across modules", async () => {
      const result1 = createMockResult({
        moduleId: "security",
        moduleName: "Security",
        strengths: [createFinding("Authentication", [{ type: "deterministic" }])],
        weaknesses: [createFinding("Authentication", [{ type: "deterministic" }])],
      });

      const validation = await validator.validate([result1]);
      const contradictionIssues = validation.issues.filter((i) => i.category === "contradiction");
      expect(contradictionIssues.length).toBeGreaterThan(0);
    });
  });

  describe("auditInferences", () => {
    it("warns when module has zero deterministic evidence", async () => {
      const result = createMockResult({
        strengths: [createFinding("AI Finding", [{ type: "inferred" }, { type: "inferred" }])],
      });

      const validation = await validator.validate([result]);
      const inferenceIssues = validation.issues.filter((i) => i.category === "inference");
      expect(inferenceIssues.length).toBeGreaterThan(0);
    });
  });

  describe("full validation", () => {
    it("returns valid=true for well-structured results", async () => {
      const result = createMockResult({
        strengths: [
          createFinding("Good architecture", [{ type: "deterministic" }, { type: "deterministic" }]),
          createFinding("Clean code", [{ type: "deterministic" }]),
        ],
        weaknesses: [
          createFinding("Minor issue", [{ type: "inferred" }]),
        ],
        recommendations: [{
          title: "Fix issue", description: "Fix it", moduleId: "code_quality" as ModuleId,
          severity: "medium" as const, confidence: "high" as const,
          evidence: [{ description: "Evidence", type: "deterministic" as const, confidence: "high" as const }],
          suggestedFix: "Do X", estimatedEffort: "hours" as const,
          expectedScoreImprovement: 5, priority: 40, roadmapPhase: "next_sprint" as const,
        }],
      });

      const validation = await validator.validate([result]);
      expect(validation.valid).toBe(true);
    });

    it("aggregates validation score correctly", async () => {
      const badResult = createMockResult({
        weaknesses: [
          { title: "No evidence 1", description: "Bad", severity: "high" as const, evidence: [], category: "test" },
          { title: "No evidence 2", description: "Bad", severity: "high" as const, evidence: [], category: "test" },
          { title: "No evidence 3", description: "Bad", severity: "high" as const, evidence: [], category: "test" },
          { title: "No evidence 4", description: "Bad", severity: "high" as const, evidence: [], category: "test" },
        ],
      });

      const validation = await validator.validate([badResult]);
      expect(validation.score).toBeLessThan(100);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });
});
