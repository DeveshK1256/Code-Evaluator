import { join } from "path";
import { tmpdir } from "os";
import { inngest } from "@/inngest/client";
import { intelligenceOrchestrator } from "@/services/intelligence/orchestrator";
import { fileDiscoveryService } from "@/services/file-discovery.service";
import { manifestService } from "@/services/manifest.service";
import { logger } from "@/lib/logger";

export const runIntelligencePipeline = inngest.createFunction(
  { id: "intelligence-pipeline", retries: 1 },
  { event: "intelligence/analyze" },
  async ({ event, step }) => {
    const { repositoryId, userId, readme, problemStatement } = event.data as {
      repositoryId: string;
      userId: string;
      readme?: string;
      problemStatement?: string;
    };

    const workspacePath = join(tmpdir(), "evaluations", repositoryId, "source");

    // Get manifest from DB
    const manifest = await step.run("load-manifest", async () => {
      const m = await manifestService.getByRepositoryId(repositoryId);
      if (!m) throw new Error(`No manifest found for repository ${repositoryId}`);
      return m;
    });

    // Scan files from workspace
    const scanResult = await step.run("scan-workspace", async () => {
      return fileDiscoveryService.scan(workspacePath, repositoryId);
    });

    // Run the orchestrated intelligence pipeline
    const result = await step.run("run-intelligence", async () => {
      return intelligenceOrchestrator.run({
        repositoryId,
        manifest: manifest as unknown as Record<string, unknown>,
        files: scanResult.files,
        readme,
        problemStatement,
        readFileContent: (path) => fileDiscoveryService.readFileContent(workspacePath, path),
        onProgress: async (status, progress) => {
          logger.info(`Intelligence progress: ${status} ${progress}%`);
        },
      });
    });

    logger.info("Intelligence pipeline complete", {
      repositoryId,
      summaryGenerated: !!result.intelligence.summary,
      graphNodes: result.intelligence.knowledgeGraph?.nodes?.length ?? 0,
      features: result.intelligence.features?.features?.length ?? 0,
    });

    return {
      success: true,
      repositoryId,
      hasSummary: !!result.intelligence.summary,
      hasArchitecture: !!result.intelligence.architecture,
      nodeCount: result.intelligence.knowledgeGraph?.nodes?.length ?? 0,
    };
  }
);
