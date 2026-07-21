import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class SummaryAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "summary",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.2,
    maxTokens: 2048,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.summary.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { manifest, chunks, readme } = input;

    return `Analyze this repository to produce a summary.

## Repository Manifest
\`\`\`json
${JSON.stringify(manifest, null, 2).substring(0, 5000)}
\`\`\`

## README
${readme ?? "No README provided."}

## Feature Chunks Available
${chunks.map((c) => `- ${c.name}`).join("\n")}

Provide the repository summary as JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.summary.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
