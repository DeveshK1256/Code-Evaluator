import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class FeaturesAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "features",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.3,
    maxTokens: 4096,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.features.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { manifest, chunks } = input;

    // Select the most relevant chunks for feature detection
    const relevantChunks = chunks.filter((c) =>
      ["auth", "dashboard", "api-routes", "components", "features", "services"].includes(c.name)
    );

    return `Identify all features in this repository.

## Repository Manifest
\`\`\`json
${JSON.stringify(manifest, null, 2).substring(0, 3000)}
\`\`\`

## Feature Chunks
${relevantChunks.map((c) => `### ${c.name}\n${c.context.substring(0, 4000)}`).join("\n\n")}

List every feature you can identify, categorize it, and cite file evidence.
Output valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.features.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
