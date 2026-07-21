import { statSync, readdirSync, readFileSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";
import { createHash } from "crypto";
import type { RepositoryFile } from "@/types/repository";

const EXCLUDED_DIRS = new Set([
  ".git", "node_modules", ".next", "build", "dist", ".venv",
  "__pycache__", ".vscode", ".idea", ".vs", "vendor",
  ".terraform", ".serverless", ".cache", "target", "bin", "obj",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".bmp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp4", ".mov", ".avi", ".mkv", ".webm",
  ".mp3", ".wav", ".ogg", ".flac",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dll", ".so", ".dylib", ".wasm",
  ".pyc", ".class", ".jar", ".o", ".obj",
  ".ico", ".svg",
]);

const GENERATED_PATTERNS = [
  /\.min\.(js|css)$/,
  /\.generated\./,
  /^dist\//,
  /^build\//,
  /\.next\//,
  /next-env\.d\.ts$/,
  /pnpm-lock\.yaml$/, /package-lock\.json$/, /yarn\.lock$/,
];

const CONFIG_FILES = new Set([
  "package.json", "tsconfig.json", "next.config.js", "next.config.ts",
  "next.config.mjs", "vite.config.ts", "vite.config.js",
  "tailwind.config.ts", "tailwind.config.js", "postcss.config.js",
  ".env", ".env.example", ".env.local",
  "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
  "Dockerfile.dev", ".dockerignore",
  ".gitignore", ".prettierrc", ".eslintrc.json", ".editorconfig",
  "firebase.json", "firestore.rules", "firestore.indexes.json",
  "terraform.tf", ".terraform.lock.hcl",
  "jest.config.ts", "jest.config.js", "vitest.config.ts",
  "playwright.config.ts",
  "vercel.json", "netlify.toml",
  "components.json",
]);

export interface FileDiscoveryResult {
  files: RepositoryFile[];
  summary: {
    totalFiles: number;
    totalSizeBytes: number;
    binaryFiles: number;
    textFiles: number;
    configFiles: number;
    generatedFiles: number;
    hiddenFiles: number;
    largestFiles: Array<{ path: string; sizeBytes: number }>;
    extensions: Record<string, number>;
  };
  directoryTree: DirectoryNode[];
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: DirectoryNode[];
}

export class FileDiscoveryService {
  /**
   * Scan a workspace directory and discover all files.
   */
  async scan(workspacePath: string, repositoryId: string): Promise<FileDiscoveryResult> {
    if (!existsSync(workspacePath)) {
      throw new Error(`Workspace path does not exist: ${workspacePath}`);
    }

    const files: RepositoryFile[] = [];
    const directoryTree: DirectoryNode[] = [];
    const extensions: Record<string, number> = {};
    const largestFiles: Array<{ path: string; sizeBytes: number }> = [];

    this.walkDirectory(workspacePath, workspacePath, repositoryId, files, directoryTree);

    // Compute summary
    let totalSizeBytes = 0;
    let binaryFiles = 0;
    let textFiles = 0;
    let configFiles = 0;
    let generatedFiles = 0;
    let hiddenFiles = 0;

    for (const file of files) {
      totalSizeBytes += file.sizeBytes;
      if (file.isBinary) binaryFiles++;
      else textFiles++;
      if (file.isConfig) configFiles++;
      if (file.isGenerated) generatedFiles++;
      if (file.isHidden) hiddenFiles++;

      // Track extensions
      if (file.extension) {
        extensions[file.extension] = (extensions[file.extension] ?? 0) + 1;
      }

      // Track largest files
      largestFiles.push({ path: file.path, sizeBytes: file.sizeBytes });
    }

    // Sort largest files
    largestFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return {
      files,
      summary: {
        totalFiles: files.length,
        totalSizeBytes,
        binaryFiles,
        textFiles,
        configFiles,
        generatedFiles,
        hiddenFiles,
        largestFiles: largestFiles.slice(0, 20),
        extensions,
      },
      directoryTree,
    };
  }

  /**
   * Generate a content fingerprint for the repository.
   */
  generateFingerprint(directoryTree: DirectoryNode[]): string {
    const hash = createHash("sha256");
    this.hashTree(directoryTree, hash);
    return hash.digest("hex");
  }

  /**
   * Read a file's content from the workspace.
   */
  readFileContent(workspacePath: string, filePath: string): string | null {
    const fullPath = join(workspacePath, filePath);
    try {
      return readFileSync(fullPath, "utf-8");
    } catch {
      return null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private walkDirectory(
    basePath: string,
    currentPath: string,
    repositoryId: string,
    files: RepositoryFile[],
    tree: DirectoryNode[],
  ): void {
    let entries: string[];
    try {
      entries = readdirSync(currentPath);
    } catch {
      return; // Permission denied or other error
    }

    for (const entry of entries.sort()) {
      const fullPath = join(currentPath, entry);
      const relativePath = relative(basePath, fullPath).replace(/\\/g, "/");

      let stats;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDED_DIRS.has(entry)) continue;
        // Skip hidden directories
        if (entry.startsWith(".") && entry !== ".") continue;

        const children: DirectoryNode[] = [];
        tree.push({
          name: entry,
          path: relativePath,
          type: "directory",
          children,
        });

        this.walkDirectory(basePath, fullPath, repositoryId, files, children);
      } else if (stats.isFile()) {
        const ext = extname(entry).toLowerCase();
        const isBinary = BINARY_EXTENSIONS.has(ext);
        const isGenerated = GENERATED_PATTERNS.some((p) => p.test(relativePath));
        const isHidden = entry.startsWith(".");
        const isConfig = CONFIG_FILES.has(entry) || CONFIG_FILES.has(relativePath);

        const file: RepositoryFile = {
          id: "",
          repositoryId,
          path: relativePath,
          name: entry,
          extension: ext,
          sizeBytes: stats.size,
          isBinary,
          isGenerated,
          isHidden,
          isConfig,
        };

        // Generate content hash for text files under 1MB
        if (!isBinary && stats.size < 1_000_000) {
          try {
            const content = readFileSync(fullPath);
            file.contentHash = createHash("sha256").update(content).digest("hex");
          } catch {
            // Skip files that can't be read
          }
        }

        files.push(file);

        tree.push({
          name: entry,
          path: relativePath,
          type: "file",
          size: stats.size,
        });
      }
    }
  }

  private hashTree(tree: DirectoryNode[], hash: ReturnType<typeof createHash>): void {
    for (const node of tree) {
      hash.update(node.path);
      hash.update(node.type);
      if (node.size !== undefined) {
        hash.update(String(node.size));
      }
      if (node.children) {
        this.hashTree(node.children, hash);
      }
    }
  }
}

export const fileDiscoveryService = new FileDiscoveryService();
