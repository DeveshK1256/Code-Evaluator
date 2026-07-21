import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class SecurityAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "security",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.2,
    maxTokens: 2048,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.security.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { chunks } = input;

    const authChunks = chunks.filter((c) => c.name === "auth");
    const middlewareChunks = chunks.filter((c) =>
      ["auth", "app-core", "config"].includes(c.name)
    );

    return `Extract authentication and authorization context from this repository.

## Auth-Related Chunks
${authChunks.map((c) => c.context.substring(0, 5000)).join("\n\n")}

## Middleware & Config
${middlewareChunks.map((c) => c.context.substring(0, 2000)).join("\n\n")}

Output valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.security.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
