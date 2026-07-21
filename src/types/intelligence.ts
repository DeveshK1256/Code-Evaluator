/**
 * Repository Intelligence Model
 *
 * The canonical structured knowledge representation for a software project.
 * Built by the multi-agent AI system and used as the foundation for all evaluation modules.
 */

// ─── Intelligence Status ──────────────────────────────────────────
export type IntelligenceStatus =
  | "pending"
  | "chunking"
  | "analyzing_architecture"
  | "analyzing_features"
  | "analyzing_security"
  | "analyzing_documentation"
  | "analyzing_problem_statement"
  | "building_knowledge_graph"
  | "complete"
  | "failed";

// ─── Intelligence Session ─────────────────────────────────────────
export interface IntelligenceSession {
  id: string;
  repositoryId: string;
  userId: string;
  status: IntelligenceStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  agentResults: Record<string, AgentResult>;
  errorMessage?: string;
}

// ─── Agent Result (each agent produces this) ──────────────────────
export interface AgentResult {
  agentName: string;
  status: "pending" | "running" | "complete" | "failed";
  startedAt?: string;
  completedAt?: string;
  output?: Record<string, unknown>;
  errorMessage?: string;
  confidence: number;
  tokensUsed: number;
}

// ─── Repository Intelligence Model (canonical output) ─────────────
export interface RepositoryIntelligence {
  id: string;
  repositoryId: string;
  version: string;
  summary: RepositorySummary;
  architecture: ArchitectureAnalysis;
  features: FeatureAnalysis;
  apis: ApiAnalysis;
  database: DatabaseAnalysis;
  auth: AuthenticationAnalysis;
  dependencies: DependencyAnalysis;
  documentation: DocumentationAnalysis;
  problemStatement: ProblemStatementAnalysis;
  knowledgeGraph: RepositoryKnowledgeGraph;
  navigation: NavigationMap;
  metadata: IntelligenceMetadata;
  createdAt: string;
}

// ─── Repository Summary ───────────────────────────────────────────
export interface RepositorySummary {
  name: string;
  description: string;
  purpose: string;
  targetUsers: string[];
  mainWorkflows: string[];
  businessProblem: string;
  confidence: number;
  evidence: Evidence[];
  isInferred: boolean;
}

// ─── Architecture Analysis ────────────────────────────────────────
export interface ArchitectureAnalysis {
  pattern: ArchitecturePattern;
  patternConfidence: number;
  patternEvidence: Evidence[];
  layers: string[];
  modules: Module[];
  entryPoints: string[];
  dataFlow: DataFlowDescription;
  keyFiles: KeyFile[];
  confidence: number;
  isInferred: boolean;
}

export type ArchitecturePattern =
  | "monolith"
  | "modular_monolith"
  | "microservices"
  | "layered"
  | "feature_based"
  | "clean_architecture"
  | "mvc"
  | "hexagonal"
  | "event_driven"
  | "unknown";

export interface Module {
  name: string;
  path: string;
  description: string;
  responsibility: string;
  keyFiles: string[];
  confidence: number;
}

export interface DataFlowDescription {
  description: string;
  flows: DataFlow[];
}

export interface DataFlow {
  name: string;
  source: string;
  target: string;
  description: string;
}

export interface KeyFile {
  path: string;
  importance: "critical" | "high" | "medium" | "low";
  reason: string;
}

// ─── Feature Analysis ─────────────────────────────────────────────
export interface FeatureAnalysis {
  features: Feature[];
  confidence: number;
  isInferred: boolean;
}

export interface Feature {
  name: string;
  description: string;
  category: FeatureCategory;
  files: string[];
  status: "complete" | "partial" | "incomplete" | "unknown";
  confidence: number;
  evidence: Evidence[];
}

export type FeatureCategory =
  | "authentication"
  | "user_management"
  | "dashboard"
  | "crud"
  | "search"
  | "filtering"
  | "notifications"
  | "file_upload"
  | "payments"
  | "ai_features"
  | "admin_panel"
  | "analytics"
  | "settings"
  | "chat"
  | "maps"
  | "offline"
  | "document_management"
  | "background_jobs"
  | "api"
  | "reporting"
  | "other";

// ─── API Analysis ─────────────────────────────────────────────────
export interface ApiAnalysis {
  routes: ApiRoute[];
  totalEndpoints: number;
  authenticatedEndpoints: number;
  publicEndpoints: number;
  confidence: number;
  isInferred: boolean;
}

export interface ApiRoute {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  description: string;
  authenticated: boolean;
  parameters: ApiParameter[];
  responseType: string;
  sourceFile?: string;
  confidence: number;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  location: "path" | "query" | "body" | "header";
}

// ─── Database Analysis ────────────────────────────────────────────
export interface DatabaseAnalysis {
  type: string;
  provider: string;
  orm?: string;
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
  migrationsPath?: string;
  confidence: number;
  isInferred: boolean;
}

export interface DatabaseTable {
  name: string;
  columns: string[];
  primaryKey?: string;
  foreignKeys: string[];
  estimatedPurpose: string;
}

export interface DatabaseRelationship {
  source: string;
  target: string;
  type: "one_to_one" | "one_to_many" | "many_to_many";
  through?: string;
}

// ─── Authentication Analysis ──────────────────────────────────────
export interface AuthenticationAnalysis {
  provider: string;
  type: "email_password" | "oauth" | "sso" | "phone" | "magic_link" | "multiple" | "unknown";
  loginFlow: string;
  sessionManagement: string;
  protectedRoutes: string[];
  authorizationStrategy: string;
  confidence: number;
  isInferred: boolean;
  evidence: Evidence[];
}

// ─── Dependency Analysis ──────────────────────────────────────────
export interface DependencyAnalysis {
  coreDependencies: string[];
  uiFramework?: string;
  backendFramework?: string;
  database?: string;
  authLibrary?: string;
  stateManagement?: string;
  stylingSolution?: string;
  buildTools: string[];
  testingLibraries: string[];
  aiSdks: string[];
  googleServices: string[];
  confidence: number;
  isInferred: boolean;
}

// ─── Documentation Analysis ───────────────────────────────────────
export interface DocumentationAnalysis {
  hasReadme: boolean;
  readmeSummary: string;
  hasSetupGuide: boolean;
  hasApiDocs: boolean;
  hasContributingGuide: boolean;
  hasLicense: boolean;
  documentationQuality: "excellent" | "good" | "adequate" | "poor" | "none";
  confidence: number;
  isInferred: boolean;
}

// ─── Problem Statement Analysis ───────────────────────────────────
export interface ProblemStatementAnalysis {
  hasProblemStatement: boolean;
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  constraints: string[];
  successCriteria: string[];
  completeness: number;
  confidence: number;
  isInferred: boolean;
}

export interface Requirement {
  id: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
}

// ─── Knowledge Graph ──────────────────────────────────────────────
export interface RepositoryKnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  confidence: number;
}

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeGraphNodeType;
  name: string;
  description?: string;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export type KnowledgeGraphNodeType =
  | "component"
  | "api_route"
  | "service"
  | "model"
  | "database_table"
  | "middleware"
  | "config"
  | "external_api"
  | "module"
  | "feature"
  | "utility"
  | "page"
  | "route_handler"
  | "provider"
  | "hook"
  | "type_definition";

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: KnowledgeGraphRelation;
  confidence: number;
}

export type KnowledgeGraphRelation =
  | "imports"
  | "calls"
  | "extends"
  | "implements"
  | "uses"
  | "configures"
  | "routes_to"
  | "renders"
  | "contains"
  | "depends_on"
  | "authenticates"
  | "queries"
  | "triggers";

// ─── Navigation Map ───────────────────────────────────────────────
export interface NavigationMap {
  pages: NavigationPage[];
  flows: NavigationFlow[];
}

export interface NavigationPage {
  path: string;
  name: string;
  description: string;
  isAuthRequired: boolean;
  children: string[];
}

export interface NavigationFlow {
  name: string;
  steps: string[];
  description: string;
}

// ─── Intelligence Metadata ────────────────────────────────────────
export interface IntelligenceMetadata {
  version: string;
  generatedAt: string;
  modelUsed: string;
  totalTokensUsed: number;
  agentCount: number;
  cacheHitRate: number;
  processingDurationMs: number;
}

// ─── Evidence ─────────────────────────────────────────────────────
export interface Evidence {
  type: "deterministic" | "inferred";
  description: string;
  filePath?: string;
  confidence: number;
}
