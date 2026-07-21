/**
 * Intelligent Chunking Service
 *
 * Splits repository files into logical feature-based units
 * rather than purely by token count. Groups related files
 * by feature boundaries, directory structure, and naming conventions.
 */

import type { RepositoryFile } from "@/types/repository";

export interface FeatureChunk {
  id: string;
  name: string;
  description: string;
  files: string[];
  fileContents: string[];
  totalTokens: number;
  priority: number;
}

export class ChunkingService {
  /**
   * Chunk repository files by feature boundaries.
   */
  async chunkByFeatures(
    files: RepositoryFile[],
    readFileContent: (path: string) => string | null
  ): Promise<FeatureChunk[]> {
    const chunks: FeatureChunk[] = [];

    // Feature-based chunk definitions using path patterns
    const featureDefinitions = this.getFeatureDefinitions();

    for (const def of featureDefinitions) {
      const matchedFiles = files.filter((f) =>
        def.patterns.some((p) => f.path.match(p))
      );

      if (matchedFiles.length === 0) continue;

      const contents: string[] = [];
      for (const f of matchedFiles) {
        const content = readFileContent(f.path);
        if (content) {
          // Redact sensitive content
          const { redactionService } = await import("./redaction.service");
          contents.push(redactionService.redactFile(f.path, content));
        }
      }

      const totalChars = contents.reduce((sum, c) => sum + c.length, 0);

      chunks.push({
        id: def.id,
        name: def.name,
        description: def.description,
        files: matchedFiles.map((f) => f.path),
        fileContents: contents,
        totalTokens: Math.ceil(totalChars / 4), // Approximate token count
        priority: def.priority,
      });
    }

    // Sort by priority (highest first)
    chunks.sort((a, b) => b.priority - a.priority);

    return chunks;
  }

  /**
   * Get a context window for a specific chunk by name.
   */
  getChunkContext(
    chunks: FeatureChunk[],
    chunkName: string
  ): { context: string; files: string[] } | null {
    const chunk = chunks.find((c) => c.name === chunkName);
    if (!chunk) return null;

    const context = chunk.fileContents
      .map((content, i) => `--- ${chunk.files[i]} ---\n${content}`)
      .join("\n\n");

    return { context, files: chunk.files };
  }

  /**
   * Estimate total tokens across all chunks.
   */
  estimateTotalTokens(chunks: FeatureChunk[]): number {
    return chunks.reduce((sum, c) => sum + c.totalTokens, 0);
  }

  /**
   * Check if a chunk is small enough for a single AI call.
   */
  isWithinTokenLimit(chunk: FeatureChunk, limit: number = 8000): boolean {
    return chunk.totalTokens <= limit;
  }

  /**
   * Smart truncation: if a chunk is too large, keep only the most important files.
   */
  truncateChunk(
    chunk: FeatureChunk,
    maxTokens: number = 8000
  ): FeatureChunk {
    if (chunk.totalTokens <= maxTokens) return chunk;

    // Keep higher priority files first
    const fileImportance = chunk.files.map((f, i) => ({
      path: f,
      content: chunk.fileContents[i] ?? "",
      tokens: Math.ceil((chunk.fileContents[i] ?? "").length / 4),
    }));

    // Sort by path length (shorter = more likely to be entry point/index)
    fileImportance.sort(
      (a, b) => a.path.length - b.path.length
    );

    const keptFiles: string[] = [];
    const keptContents: string[] = [];
    let totalTokens = 0;

    for (const file of fileImportance) {
      if (totalTokens + file.tokens <= maxTokens) {
        keptFiles.push(file.path);
        keptContents.push(file.content);
        totalTokens += file.tokens;
      }
    }

    return {
      ...chunk,
      files: keptFiles,
      fileContents: keptContents,
      totalTokens,
    };
  }

  /**
   * Get content for a specific list of files (used by agents).
   */
  getFilesContent(
    files: RepositoryFile[],
    paths: string[],
    readFileContent: (path: string) => string | null
  ): string {
    return paths
      .map((p) => {
        const file = files.find((f) => f.path === p);
        if (!file) return null;
        const content = readFileContent(p);
        if (!content) return null;
        return `--- ${p} ---\n${content}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  // ─── Private ────────────────────────────────────────────

  private getFeatureDefinitions(): Array<{
    id: string;
    name: string;
    description: string;
    patterns: RegExp[];
    priority: number;
  }> {
    return [
      {
        id: "auth",
        name: "Authentication",
        description: "Authentication, login, registration, session management",
        patterns: [
          /auth/i, /login/i, /register/i, /signup/i, /signin/i,
          /logout/i, /session/i, /oauth/i, /password/i,
          /middleware\.(ts|js)$/,
        ],
        priority: 100,
      },
      {
        id: "app-core",
        name: "Application Core",
        description: "Main app entry, layout, routing, providers",
        patterns: [
          /^src\/app\/(layout|page)\.(tsx|ts|js)$/,
          /^app\/(layout|page)\.(tsx|ts|js)$/,
          /^src\/main\.(ts|js)$/,
          /providers?\//,
          /router/,
        ],
        priority: 95,
      },
      {
        id: "dashboard",
        name: "Dashboard",
        description: "Dashboard pages, stats, overview widgets",
        patterns: [
          /dashboard/i,
          /overview/i,
          /stats?\//,
          /analytics/i,
        ],
        priority: 85,
      },
      {
        id: "api-routes",
        name: "API Routes",
        description: "Backend API endpoints and handlers",
        patterns: [
          /\/api\//,
          /route\.(ts|js)$/,
          /controllers?\//,
        ],
        priority: 80,
      },
      {
        id: "components",
        name: "UI Components",
        description: "Reusable UI components and widgets",
        patterns: [
          /\/components\//,
          /\/ui\//,
        ],
        priority: 75,
      },
      {
        id: "services",
        name: "Services",
        description: "Business logic services and API clients",
        patterns: [
          /\/services\//,
          /\/lib\//,
        ],
        priority: 70,
      },
      {
        id: "database",
        name: "Database",
        description: "Database schema, models, migrations, queries",
        patterns: [
          /\/models?\//,
          /\/migrations\//,
          /schema/i,
          /prisma\//,
          /drizzle\//,
          /\/db\//,
        ],
        priority: 65,
      },
      {
        id: "config",
        name: "Configuration",
        description: "App configuration, environment, build setup",
        patterns: [
          /^package\.json$/,
          /^tsconfig\./,
          /^next\.config\./,
          /^vite\.config\./,
          /^tailwind\.config\./,
          /^\.env/,
          /docker/,
        ],
        priority: 60,
      },
      {
        id: "features",
        name: "Feature Modules",
        description: "Feature-specific code not captured by other chunks",
        patterns: [
          /\/features?\//,
        ],
        priority: 55,
      },
      {
        id: "hooks",
        name: "Hooks & Utilities",
        description: "React hooks, custom hooks, utility functions",
        patterns: [
          /\/hooks?\//,
          /\/utils?\//,
          /\/helpers?\//,
        ],
        priority: 50,
      },
      {
        id: "styles",
        name: "Styling & Themes",
        description: "CSS, themes, design tokens, style configuration",
        patterns: [
          /\.css$/,
          /\.scss$/,
          /\/styles?\//,
          /theme/i,
        ],
        priority: 40,
      },
      {
        id: "tests",
        name: "Tests",
        description: "Test files and test configuration",
        patterns: [
          /\.test\./,
          /\.spec\./,
          /\/tests?\//,
          /\/__tests__\//,
          /\/e2e\//,
          /\/cypress\//,
          /\/playwright\//,
        ],
        priority: 35,
      },
      {
        id: "types",
        name: "Type Definitions",
        description: "TypeScript types, interfaces, type definitions",
        patterns: [
          /\/types?\//,
          /\.d\.ts$/,
          /interfaces?\//,
        ],
        priority: 30,
      },
      {
        id: "docs",
        name: "Documentation",
        description: "Documentation files and README",
        patterns: [
          /^README/i,
          /^CONTRIBUTING/i,
          /^CHANGELOG/i,
          /^LICENSE$/,
          /\.md$/,
          /\/docs?\//,
        ],
        priority: 25,
      },
    ];
  }
}

export const chunkingService = new ChunkingService();
