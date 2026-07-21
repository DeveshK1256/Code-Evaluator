import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class ArchitectureAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "architecture",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.2,
    maxTokens: 4096,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.architecture.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { manifest, chunks } = input;

    const relevantChunks = chunks.filter((c) =>
      ["app-core", "api-routes", "services", "config", "components"].includes(c.name)
    );

    return `Analyze this repository's architecture.

## Repository Manifest
\`\`\`json
${JSON.stringify(manifest, null, 2).substring(0, 3000)}
\`\`\`

## Key Feature Chunks
${relevantChunks.map((c) => `### ${c.name}\n${c.context.substring(0, 3000)}`).join("\n\n")}

Determine the architectural pattern, layers, modules, data flow, and key files.
Output valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.architecture.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
