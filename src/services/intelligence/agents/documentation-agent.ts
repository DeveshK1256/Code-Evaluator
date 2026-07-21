import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class DocumentationAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "documentation",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.2,
    maxTokens: 2048,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.documentation.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { readme, chunks } = input;

    const docChunks = chunks.filter((c) => c.name === "docs");

    return `Evaluate the documentation for this repository.

## README Content
${readme ?? "No README provided."}

## Documentation Files
${docChunks.map((c) => c.context.substring(0, 5000)).join("\n\n")}

Output valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.documentation.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
