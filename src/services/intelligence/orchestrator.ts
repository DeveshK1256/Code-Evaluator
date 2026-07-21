import { getAllAgents } from "./registry";
import { chunkingService } from "@/services/chunking.service";
import { redactionService } from "@/services/redaction.service";
import { aiCacheService } from "@/services/ai-cache.service";
import { logger } from "@/lib/logger";
import type { RepositoryFile } from "@/types/repository";
import type { RepositoryIntelligence, IntelligenceSession, IntelligenceStatus, ArchitecturePattern, AuthenticationAnalysis, DocumentationAnalysis } from "@/types/intelligence";

export interface OrchestratorInput {
  repositoryId: string;
  manifest: Record<string, unknown>;
  files: RepositoryFile[];
  readme?: string;
  problemStatement?: string;
  readFileContent: (path: string) => string | null;
  onProgress?: (status: IntelligenceStatus, progress: number) => Promise<void>;
}

export class IntelligenceOrchestrator {
  /**
   * Run the full intelligence pipeline.
   */
  async run(input: OrchestratorInput): Promise<{
    intelligence: Partial<RepositoryIntelligence>;
    session: Partial<IntelligenceSession>;
  }> {
    const { repositoryId, manifest, files, readme, problemStatement, readFileContent, onProgress } = input;
    const startTime = Date.now();

    await onProgress?.("chunking", 5);

    // 1. Redact sensitive data
    const redactedFiles = files.filter((f) => !redactionService.shouldExclude(f.path));
    const redactedReadFile = (path: string) => {
      const content = readFileContent(path);
      if (!content) return null;
      return redactionService.redactFile(path, content);
    };

    // 2. Chunk files by features
    const chunks = await chunkingService.chunkByFeatures(redactedFiles, redactedReadFile);

    if (chunks.length === 0) {
      throw new Error("No feature chunks could be generated from the repository");
    }

    await onProgress?.("chunking", 15);

    // 3. Prepare agent input
    const agentInput = {
      manifest: manifest as Record<string, unknown>,
      chunks: chunks.map((c) => ({
        id: c.id,
        name: c.name,
        context: c.fileContents
          .slice(0, 5) // Max 5 files per chunk for agent context
          .map((content, i) => `--- ${c.files[i]} ---\n${content.substring(0, 3000)}`)
          .join("\n\n"),
        files: c.files,
      })),
      problemStatement,
      readme,
    };

    // 4. Run agents sequentially (architecture first, then features, etc.)
    const agents = getAllAgents();
    const agentResults: Record<string, unknown> = {};
    const statusMap: Record<string, IntelligenceStatus> = {
      summary: "analyzing_architecture" as IntelligenceStatus,
      architecture: "analyzing_architecture" as IntelligenceStatus,
      features: "analyzing_features" as IntelligenceStatus,
      security: "analyzing_security" as IntelligenceStatus,
      documentation: "analyzing_documentation" as IntelligenceStatus,
      problem_statement: "analyzing_problem_statement" as IntelligenceStatus,
    };

    let progress = 20;
    const progressPerAgent = Math.floor(60 / agents.length);

    for (const agent of agents) {
      const status = statusMap[agent.config.name] ?? "analyzing_features";
      await onProgress?.(status, progress);

      logger.info(`Running agent: ${agent.config.name}`);
      const result = await agent.run(agentInput);

      if (result.status === "complete" && result.output) {
        agentResults[agent.config.name] = result.output;
      }

      agentResults[`${agent.config.name}_result`] = result;
      progress += progressPerAgent;
    }

    // 5. Build knowledge graph
    await onProgress?.("building_knowledge_graph", 85);

    const knowledgeGraph = this.buildKnowledgeGraph(agentResults, chunks);

    // 6. Assemble intelligence model
    await onProgress?.("building_knowledge_graph", 95);

    const summary = agentResults.summary as Record<string, unknown> ?? {};
    const architecture = agentResults.architecture as Record<string, unknown> ?? {};
    const features = agentResults.features as Record<string, unknown> ?? {};
    const security = agentResults.security as Record<string, unknown> ?? {};
    const documentation = agentResults.documentation as Record<string, unknown> ?? {};
    const problemStatementResult = agentResults.problem_statement as Record<string, unknown> ?? {};

    const intelligence: Partial<RepositoryIntelligence> = {
      repositoryId,
      version: "1.0",
      summary: {
        name: summary.name as string ?? "",
        description: summary.description as string ?? "",
        purpose: summary.purpose as string ?? "",
        targetUsers: (summary.targetUsers as string[]) ?? [],
        mainWorkflows: (summary.mainWorkflows as string[]) ?? [],
        businessProblem: summary.businessProblem as string ?? "",
        confidence: (summary.confidence as number) ?? 0.5,
        evidence: (summary.evidence as never[]) ?? [],
        isInferred: (summary.isInferred as boolean) ?? true,
      },
      architecture: {
        pattern: (architecture.pattern as ArchitecturePattern) ?? "unknown",
        patternConfidence: (architecture.patternConfidence as number) ?? 0,
        patternEvidence: (architecture.patternEvidence as never[]) ?? [],
        layers: (architecture.layers as string[]) ?? [],
        modules: (architecture.modules as never[]) ?? [],
        entryPoints: (architecture.entryPoints as string[]) ?? [],
        dataFlow: (architecture.dataFlow as { description: string; flows: never[] }) ?? { description: "", flows: [] },
        keyFiles: (architecture.keyFiles as never[]) ?? [],
        confidence: (architecture.confidence as number) ?? 0.5,
        isInferred: (architecture.isInferred as boolean) ?? true,
      },
      features: {
        features: (features.features as never[]) ?? [],
        confidence: (features.confidence as number) ?? 0.5,
        isInferred: (features.isInferred as boolean) ?? true,
      },
      auth: {
        provider: (security.provider as string) ?? "unknown",
        type: ((security.type as string) ?? "unknown") as AuthenticationAnalysis["type"],
        loginFlow: (security.loginFlow as string) ?? "",
        sessionManagement: (security.sessionManagement as string) ?? "",
        protectedRoutes: (security.protectedRoutes as string[]) ?? [],
        authorizationStrategy: (security.authorizationStrategy as string) ?? "",
        confidence: (security.confidence as number) ?? 0.5,
        isInferred: (security.isInferred as boolean) ?? true,
        evidence: (security.evidence as never[]) ?? [],
      },
      documentation: {
        hasReadme: (documentation.hasReadme as boolean) ?? false,
        readmeSummary: (documentation.readmeSummary as string) ?? "",
        hasSetupGuide: (documentation.hasSetupGuide as boolean) ?? false,
        hasApiDocs: (documentation.hasApiDocs as boolean) ?? false,
        hasContributingGuide: (documentation.hasContributingGuide as boolean) ?? false,
        hasLicense: (documentation.hasLicense as boolean) ?? false,
        documentationQuality: ((documentation.documentationQuality as string) ?? "none") as DocumentationAnalysis["documentationQuality"],
        confidence: (documentation.confidence as number) ?? 0.5,
        isInferred: (documentation.isInferred as boolean) ?? true,
      },
      problemStatement: {
        hasProblemStatement: (problemStatementResult.hasProblemStatement as boolean) ?? false,
        functionalRequirements: (problemStatementResult.functionalRequirements as never[]) ?? [],
        nonFunctionalRequirements: (problemStatementResult.nonFunctionalRequirements as never[]) ?? [],
        constraints: (problemStatementResult.constraints as string[]) ?? [],
        successCriteria: (problemStatementResult.successCriteria as string[]) ?? [],
        completeness: (problemStatementResult.completeness as number) ?? 0,
        confidence: (problemStatementResult.confidence as number) ?? 0.5,
        isInferred: (problemStatementResult.isInferred as boolean) ?? true,
      },
      knowledgeGraph,
      navigation: { pages: [], flows: [] },
      metadata: {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        modelUsed: "gemini-2.5-pro-exp-03-25",
        totalTokensUsed: Object.values(agentResults).reduce(
          (sum: number, r: unknown) => sum + ((r as { tokensUsed?: number })?.tokensUsed ?? 0),
          0
        ),
        agentCount: agents.length,
        cacheHitRate: 0,
        processingDurationMs: Date.now() - startTime,
      },
      createdAt: new Date().toISOString(),
    };

    await onProgress?.("complete", 100);

    return {
      intelligence,
      session: {
        repositoryId,
        status: "complete",
        progress: 100,
        agentResults: agentResults as Record<string, never>,
      },
    };
  }

  /**
   * Build a knowledge graph from agent results and chunks.
   */
  private buildKnowledgeGraph(
    agentResults: Record<string, unknown>,
    chunks: Array<{ id: string; name: string; files: string[] }>
  ): { nodes: never[]; edges: never[]; confidence: number } {
    const nodes: Array<{ id: string; type: string; name: string; filePath?: string }> = [];
    const edges: Array<{ source: string; target: string; relation: string; confidence: number }> = [];

    // Add feature chunks as nodes
    for (const chunk of chunks) {
      nodes.push({
        id: `chunk:${chunk.id}`,
        type: "module",
        name: chunk.name,
      });

      for (const file of chunk.files.slice(0, 20)) {
        const fileNodeId = `file:${file}`;
        if (!nodes.find((n) => n.id === fileNodeId)) {
          nodes.push({
            id: fileNodeId,
            type: "component",
            name: file.split("/").pop() ?? file,
            filePath: file,
          });
        }
        edges.push({
          source: `chunk:${chunk.id}`,
          target: fileNodeId,
          relation: "contains",
          confidence: 1.0,
        });
      }
    }

    return {
      nodes: nodes as never[],
      edges: edges as never[],
      confidence: 0.8,
    };
  }
}

export const intelligenceOrchestrator = new IntelligenceOrchestrator();
