// ─── Repository Lifecycle ─────────────────────────────────────────
export type RepositorySource = "github" | "zip" | "folder" | "readme";

export type RepositoryStatus =
  | "pending"
  | "uploading"
  | "validating"
  | "extracting"
  | "scanning"
  | "detecting"
  | "manifest_ready"
  | "ready_for_analysis"
  | "analysis_running"
  | "evaluation_complete"
  | "failed"
  | "archived";

export const REPOSITORY_STATUS_FLOW: Record<RepositoryStatus, RepositoryStatus[]> = {
  pending: ["uploading", "validating", "failed"],
  uploading: ["validating", "failed"],
  validating: ["extracting", "failed"],
  extracting: ["scanning", "failed"],
  scanning: ["detecting", "failed"],
  detecting: ["manifest_ready", "failed"],
  manifest_ready: ["ready_for_analysis", "failed"],
  ready_for_analysis: ["analysis_running", "archived", "failed"],
  analysis_running: ["evaluation_complete", "failed"],
  evaluation_complete: ["archived", "ready_for_analysis"],
  failed: ["pending", "archived"],
  archived: [],
};

// ─── Repository Entity ────────────────────────────────────────────
export interface Repository {
  id: string;
  userId: string;
  name: string;
  source: RepositorySource;
  status: RepositoryStatus;
  statusMessage?: string;
  progress: number; // 0-100

  // Source-specific
  githubUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  defaultBranch?: string;
  visibility?: "public" | "private" | "unknown";

  // Metadata
  description?: string;
  license?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  sizeBytes?: number;
  fileCount?: number;
  primaryLanguage?: string;
  topics?: string[];
  lastUpdated?: string;
  commitCount?: number;
  contributorCount?: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasCiCd: boolean;

  // Storage
  workspacePath?: string;
  contentFingerprint?: string;
  manifestId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ─── Repository File ──────────────────────────────────────────────
export interface RepositoryFile {
  id: string;
  repositoryId: string;
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  mimeType?: string;
  isBinary: boolean;
  isGenerated: boolean;
  isHidden: boolean;
  isConfig: boolean;
  contentHash?: string;
}

// ─── Technology Profile ───────────────────────────────────────────
export interface TechnologyProfile {
  id: string;
  repositoryId: string;
  categories: Record<string, TechnologyItem[]>;
  detectedAt: string;
}

export interface TechnologyItem {
  name: string;
  category: "language" | "framework" | "database" | "infrastructure" | "ci_cd" | "hosting" | "tool";
  version?: string;
  confidence: number; // 0.0 - 1.0
  evidence?: string[]; // file paths that indicate this technology
}

// ─── Repository Manifest ──────────────────────────────────────────
export interface RepositoryManifest {
  id: string;
  repositoryId: string;
  version: string;
  metadata: RepositoryMetadata;
  files: ManifestFileEntry[];
  technologies: TechnologyProfile;
  dependencies: ManifestDependency[];
  configuration: Record<string, string[]>;
  generatedAt: string;
}

export interface RepositoryMetadata {
  name: string;
  source: RepositorySource;
  description?: string;
  defaultBranch?: string;
  license?: string;
  stars?: number;
  forks?: number;
  totalFiles: number;
  totalSizeBytes: number;
  primaryLanguage?: string;
  hasReadme: boolean;
  hasLicense: boolean;
  hasCiCd: boolean;
}

export interface ManifestFileEntry {
  path: string;
  name: string;
  extension: string;
  sizeBytes: number;
  isBinary: boolean;
  isGenerated: boolean;
  isConfig: boolean;
  directory: string;
}

export interface ManifestDependency {
  name: string;
  version?: string;
  type: "runtime" | "dev" | "peer" | "unknown";
  ecosystem?: string;
}

// ─── Upload ───────────────────────────────────────────────────────
export interface Upload {
  id: string;
  userId: string;
  repositoryId: string;
  source: RepositorySource;
  status: "uploading" | "validating" | "processing" | "completed" | "failed";
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  progress: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// ─── GitHub Metadata (from API) ───────────────────────────────────
export interface GitHubRepoMetadata {
  owner: string;
  repo: string;
  description: string | null;
  defaultBranch: string;
  visibility: "public" | "private";
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  size: number;
  pushedAt: string;
  hasIssues: boolean;
  hasWiki: boolean;
  archived: boolean;
  empty: boolean;
}

// ─── API Request/Response types ──────────────────────────────────
export interface CreateRepositoryFromGitHubRequest {
  githubUrl: string;
  name?: string;
}

export interface CreateRepositoryFromUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface RepositoryStatusResponse {
  id: string;
  status: RepositoryStatus;
  progress: number;
  statusMessage?: string;
  source: RepositorySource;
  createdAt: string;
  completedAt?: string;
}
