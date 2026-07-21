import { BaseAgent, type AgentConfig, type AgentInput } from "@/services/intelligence/base-agent";
import { PROMPTS } from "@/services/intelligence/prompts";

export class ProblemStatementAgent extends BaseAgent {
  readonly config: AgentConfig = {
    name: "problem_statement",
    version: "1.0",
    model: "gemini-2.5-pro-exp-03-25",
    temperature: 0.2,
    maxTokens: 4096,
    useCache: true,
  };

  buildSystemPrompt(): string {
    return PROMPTS.problemStatement.system;
  }

  buildUserPrompt(input: AgentInput): string {
    const { problemStatement } = input;

    if (!problemStatement) {
      return JSON.stringify({
        hasProblemStatement: false,
        note: "No problem statement was provided.",
      });
    }

    return `Extract structured requirements from this problem statement.

## Problem Statement
${problemStatement}

Parse this document and identify all functional requirements, non-functional requirements, constraints, and success criteria.
Output valid JSON matching the schema.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return PROMPTS.problemStatement.schema;
  }

  async execute(input: AgentInput): Promise<Record<string, unknown>> {
    return {};
  }
}
