export type MaturityLevel = "prototype" | "early_mvp" | "production_candidate" | "production_ready" | "enterprise_grade";

export interface MaturityAssessment {
  overall: MaturityLevel;
  dimensions: MaturityDimension[];
  scores: MaturityScores;
  generatedAt: string;
}

export interface MaturityDimension {
  name: string;
  score: number;
  level: MaturityLevel;
  strengths: string[];
  gaps: string[];
  evidence: string[];
}

export interface MaturityScores {
  codeOrganization: number;
  testing: number;
  security: number;
  documentation: number;
  devOps: number;
  observability: number;
  accessibility: number;
  performance: number;
  aiIntegration: number;
}

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  effort: "minutes" | "hours" | "days" | "weeks";
  impact: number;
  dependencies: string[];
  relatedFindings: string[];
  suggestedOrder: number;
  category: string;
}

export interface SprintPlan {
  sprint: string;
  tasks: SprintTask[];
  totalEffort: string;
  expectedImpact: number;
  createdAt: string;
}

export interface LearningResource {
  topic: string;
  category: string;
  currentLevel: string;
  recommendedResources: ResourceItem[];
  nextSteps: string[];
  estimatedTimeToImprove: string;
}

export interface ResourceItem {
  title: string;
  type: "documentation" | "tutorial" | "course" | "book" | "tool" | "practice";
  description: string;
  url?: string;
  priority: "critical" | "recommended" | "optional";
}

export interface JudgePerspective {
  name: string;
  role: string;
  focusAreas: string[];
  score: number;
  topFindings: string[];
  recommendations: string[];
  priorityDifferences: string[];
}

export interface DeveloperScorecard {
  overallScore: number;
  overallGrade: string;
  maturityLevel: MaturityLevel;
  categoryScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  highImpactImprovements: string[];
  benchmarkPercentile?: number;
  progressSinceLastAnalysis?: { score: number; direction: "up" | "down" | "stable" };
  generatedAt: string;
}

export interface ConsensusResult {
  moduleId: string;
  agents: number;
  agreements: number;
  disagreements: number;
  confidence: number;
  finalScore: number;
  resolvedConflicts: ConflictResolution[];
}

export interface ConflictResolution {
  issue: string;
  positionA: string;
  positionB: string;
  resolution: string;
  evidence: string[];
}
