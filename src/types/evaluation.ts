// ─── Evaluation Module Types ──────────────────────────────────────
export type ModuleId =
  | "code_quality" | "security" | "performance" | "testing"
  | "accessibility" | "google_services" | "problem_alignment"
  | "architecture" | "documentation" | "maintainability"
  | "scalability" | "technical_debt" | "dependency_health"
  | "api_design" | "database_design" | "devops"
  | "error_handling" | "logging" | "ai_integration"
  | "ui_consistency" | "mobile_responsiveness" | "seo";

export type EvaluationStatus = "pending" | "running" | "validating" | "scoring" | "complete" | "failed";

export type ConfidenceLabel = "high" | "medium" | "low";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type EffortEstimate = "minutes" | "hours" | "days" | "weeks";

// ─── Evaluation Session ───────────────────────────────────────────
export interface EvaluationSession {
  id: string;
  repositoryId: string;
  userId: string;
  profileId: string;
  status: EvaluationStatus;
  progress: number;
  selectedModules: ModuleId[];
  overallScore: number;
  overallGrade: string;
  overallConfidence: number;
  startedAt: string;
  completedAt?: string;
}

// ─── Evaluation Profile / Rubric ──────────────────────────────────
export interface EvaluationProfile {
  id: string;
  name: string;
  description: string;
  weights: Record<ModuleId, number>;
  isDefault: boolean;
}

// ─── Module Result ────────────────────────────────────────────────
export interface ModuleResult {
  moduleId: ModuleId;
  moduleName: string;
  score: number;
  grade: string;
  confidence: ConfidenceLabel;
  confidenceValue: number;
  summary: string;
  strengths: Finding[];
  weaknesses: Finding[];
  risks: Risk[];
  missingPractices: string[];
  evidence: EvidenceItem[];
  recommendations: Recommendation[];
  evaluatedAt: string;
}

// ─── Finding (strength or weakness) ───────────────────────────────
export interface Finding {
  title: string;
  description: string;
  severity: Severity;
  evidence: EvidenceItem[];
  category: string;
}

// ─── Evidence ─────────────────────────────────────────────────────
export interface EvidenceItem {
  description: string;
  filePath?: string;
  lineNumber?: number;
  type: "deterministic" | "inferred";
  confidence: ConfidenceLabel;
}

// ─── Risk ─────────────────────────────────────────────────────────
export interface Risk {
  title: string;
  description: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
}

// ─── Recommendation ───────────────────────────────────────────────
export interface Recommendation {
  title: string;
  description: string;
  moduleId: ModuleId;
  severity: Severity;
  confidence: ConfidenceLabel;
  evidence: EvidenceItem[];
  suggestedFix: string;
  estimatedEffort: EffortEstimate;
  expectedScoreImprovement: number;
  priority: number;
  roadmapPhase: "immediate" | "next_sprint" | "future";
}

// ─── Improvement Roadmap ──────────────────────────────────────────
export interface ImprovementRoadmap {
  immediate: RoadmapItem[];
  nextSprint: RoadmapItem[];
  future: RoadmapItem[];
}

export interface RoadmapItem {
  title: string;
  description: string;
  moduleId: ModuleId;
  effort: EffortEstimate;
  expectedImpact: number;
  dependencies: string[];
}

// ─── Scoring Configuration ────────────────────────────────────────
export interface ScoringConfig {
  weights: Record<ModuleId, number>;
  thresholds: GradeThreshold[];
}

export interface GradeThreshold {
  grade: string;
  minScore: number;
  label: string;
}

// ─── API Request/Response ─────────────────────────────────────────
export interface StartEvaluationRequest {
  repositoryId: string;
  profileId?: string;
  selectedModules?: ModuleId[];
  customWeights?: Record<ModuleId, number>;
}

export interface EvaluationStatusResponse {
  id: string;
  status: EvaluationStatus;
  progress: number;
  currentModule?: string;
  completedModules: string[];
  failedModules: string[];
}
