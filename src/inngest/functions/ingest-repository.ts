import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { inngest } from "@/inngest/client";
import { repositoryService } from "@/services/repository.service";
import { gitHubService } from "@/services/github.service";
import { zipService } from "@/services/zip.service";
import { fileDiscoveryService } from "@/services/file-discovery.service";
import { techDetectionService } from "@/services/tech-detection.service";
import { manifestService } from "@/services/manifest.service";
import { logger } from "@/lib/logger";

/**
 * Ingest a GitHub repository: clone, scan, detect tech, build manifest.
 */
export const ingestGitHubRepository = inngest.createFunction(
  { id: "ingest-github-repository", retries: 2 },
  { event: "repository/github.ingest" },
  async ({ event, step }) => {
    const { repositoryId, owner, repo, branch, userId } = event.data as {
      repositoryId: string;
      owner: string;
      repo: string;
      branch?: string;
      userId: string;
    };

    const workspacePath = join(tmpdir(), "evaluations", repositoryId, "source");
    if (!existsSync(workspacePath)) {
      mkdirSync(workspacePath, { recursive: true });
    }

    try {
      // 1. Update status to extracting/cloning
      await step.run("update-status-cloning", async () => {
        await repositoryService.updateStatus(repositoryId, "extracting", {
          progress: 10,
          statusMessage: "Cloning repository...",
          workspacePath,
        });
      });

      // 2. Clone the repository
      await step.run("git-clone", async () => {
        await gitHubService.cloneToWorkspace(owner, repo, workspacePath, branch);
      });

      await repositoryService.updateStatus(repositoryId, "extracting", {
        progress: 30,
        statusMessage: "Repository cloned. Scanning files...",
      });

      // 3. Fetch GitHub metadata
      let metadata = null;
      try {
        metadata = await step.run("fetch-metadata", async () => {
          return gitHubService.fetchMetadata(owner, repo);
        });
      } catch (metaError) {
        logger.warn("Failed to fetch GitHub metadata", { owner, repo, error: String(metaError) });
      }

      // 4. Scan files
      await repositoryService.updateStatus(repositoryId, "scanning", {
        progress: 40,
        statusMessage: "Scanning repository structure...",
      });

      const scanResult = await step.run("scan-files", async () => {
        return fileDiscoveryService.scan(workspacePath, repositoryId);
      });

      const fingerprint = fileDiscoveryService.generateFingerprint(scanResult.directoryTree);

      await repositoryService.updateMetadata(repositoryId, {
        sizeBytes: scanResult.summary.totalSizeBytes,
        fileCount: scanResult.summary.totalFiles,
        hasReadme: scanResult.files.some((f) => f.path.toLowerCase().startsWith("readme")),
        hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
        hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
        primaryLanguage: metadata?.language ?? undefined,
        description: metadata?.description ?? undefined,
        defaultBranch: metadata?.defaultBranch ?? branch,
        visibility: metadata?.visibility ?? "unknown",
        stars: metadata?.stars ?? 0,
        forks: metadata?.forks ?? 0,
        openIssues: metadata?.openIssues ?? 0,
        topics: metadata?.topics ?? [],
        license: metadata?.license ?? undefined,
        lastUpdated: metadata?.pushedAt ?? undefined,
      });

      // 5. Detect technologies
      await repositoryService.updateStatus(repositoryId, "detecting", {
        progress: 60,
        statusMessage: "Detecting technologies...",
      });

      const techResult = await step.run("detect-technologies", async () => {
        return techDetectionService.detect(
          scanResult.files.map((f) => f.path),
          async (path) => fileDiscoveryService.readFileContent(workspacePath, path)
        );
      });

      // 6. Generate manifest
      await repositoryService.updateStatus(repositoryId, "detecting", {
        progress: 80,
        statusMessage: "Generating repository manifest...",
      });

      const manifest = await step.run("generate-manifest", async () => {
        return manifestService.generate({
          repositoryId,
          name: repo,
          source: "github",
          description: metadata?.description ?? undefined,
          defaultBranch: metadata?.defaultBranch ?? branch,
          license: metadata?.license ?? undefined,
          stars: metadata?.stars ?? undefined,
          forks: metadata?.forks ?? undefined,
          totalFiles: scanResult.summary.totalFiles,
          totalSizeBytes: scanResult.summary.totalSizeBytes,
          primaryLanguage: metadata?.language ?? undefined,
          hasReadme: scanResult.summary.configFiles > 0,
          hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
          hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
          files: scanResult.files,
          technologies: techResult,
          directoryTree: scanResult.directoryTree,
        });
      });

      // 7. Mark ready
      await step.run("mark-ready", async () => {
        await repositoryService.updateStatus(repositoryId, "ready_for_analysis", {
          progress: 100,
          statusMessage: "Repository ready for analysis",
          contentFingerprint: fingerprint,
          manifestId: manifest.id,
        });
      });

      logger.info("Repository ingestion complete", {
        repositoryId,
        fileCount: scanResult.summary.totalFiles,
        technologies: techResult.items.length,
      });

      return {
        success: true,
        repositoryId,
        fileCount: scanResult.summary.totalFiles,
        technologies: techResult.items.map((t) => t.name),
        manifestId: manifest.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Repository ingestion failed", { repositoryId, error: message });

      await step.run("mark-failed", async () => {
        await repositoryService.updateStatus(repositoryId, "failed", {
          progress: 0,
          statusMessage: message.substring(0, 500),
        });
      });

      throw error;
    }
  }
);

/**
 * Ingest a ZIP upload: extract, scan, detect tech, build manifest.
 */
export const ingestZipRepository = inngest.createFunction(
  { id: "ingest-zip-repository", retries: 2 },
  { event: "repository/zip.ingest" },
  async ({ event, step }) => {
    const { repositoryId, buffer, userId } = event.data as {
      repositoryId: string;
      buffer: number[]; // Buffer as number array for serialization
      userId: string;
    };

    const workspacePath = join(tmpdir(), "evaluations", repositoryId, "source");
    if (!existsSync(workspacePath)) {
      mkdirSync(workspacePath, { recursive: true });
    }

    try {
      // 1. Validate and extract
      await step.run("validate-extract", async () => {
        await repositoryService.updateStatus(repositoryId, "validating", {
          progress: 10,
          statusMessage: "Validating ZIP file...",
        });

        const zipBuffer = Buffer.from(buffer);
        const validation = await zipService.validate(zipBuffer, "upload.zip");
        if (!validation.valid) {
          throw new Error(validation.message ?? "Invalid ZIP file");
        }

        await repositoryService.updateStatus(repositoryId, "extracting", {
          progress: 30,
          statusMessage: "Extracting ZIP contents...",
        });

        return zipService.extract(zipBuffer, workspacePath);
      });

      // 2. Scan files
      await repositoryService.updateStatus(repositoryId, "scanning", {
        progress: 50,
        statusMessage: "Scanning extracted files...",
      });

      const scanResult = await step.run("scan-files", async () => {
        return fileDiscoveryService.scan(workspacePath, repositoryId);
      });

      const fingerprint = fileDiscoveryService.generateFingerprint(scanResult.directoryTree);

      await repositoryService.updateMetadata(repositoryId, {
        sizeBytes: scanResult.summary.totalSizeBytes,
        fileCount: scanResult.summary.totalFiles,
        hasReadme: scanResult.files.some((f) => f.path.toLowerCase().startsWith("readme")),
        hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
        hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
      });

      // 3. Detect technologies
      await repositoryService.updateStatus(repositoryId, "detecting", {
        progress: 70,
        statusMessage: "Detecting technologies...",
      });

      const techResult = await step.run("detect-technologies", async () => {
        return techDetectionService.detect(
          scanResult.files.map((f) => f.path),
          async (path) => fileDiscoveryService.readFileContent(workspacePath, path)
        );
      });

      // 4. Generate manifest
      await repositoryService.updateStatus(repositoryId, "detecting", {
        progress: 85,
        statusMessage: "Generating manifest...",
      });

      const manifest = await step.run("generate-manifest", async () => {
        return manifestService.generate({
          repositoryId,
          name: `Upload ${new Date().toLocaleDateString()}`,
          source: "zip",
          totalFiles: scanResult.summary.totalFiles,
          totalSizeBytes: scanResult.summary.totalSizeBytes,
          hasReadme: scanResult.summary.configFiles > 0,
          hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
          hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
          files: scanResult.files,
          technologies: techResult,
          directoryTree: scanResult.directoryTree,
        });
      });

      // 5. Mark ready
      await step.run("mark-ready", async () => {
        await repositoryService.updateStatus(repositoryId, "ready_for_analysis", {
          progress: 100,
          statusMessage: "Upload ready for analysis",
          contentFingerprint: fingerprint,
          manifestId: manifest.id,
        });
      });

      return { success: true, repositoryId, fileCount: scanResult.summary.totalFiles };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("ZIP ingestion failed", { repositoryId, error: message });

      await step.run("mark-failed", async () => {
        await repositoryService.updateStatus(repositoryId, "failed", {
          progress: 0,
          statusMessage: message.substring(0, 500),
        });
      });

      throw error;
    }
  }
);
