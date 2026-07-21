import { callGeminiWithRetry } from "@/lib/gemini/client";
import { aiCacheService } from "@/services/ai-cache.service";
import { logger } from "@/lib/logger";
import type { AgentResult } from "@/types/intelligence";

export interface AgentConfig {
  name: string;
  version: string;
  model: string;
  temperature: number;
  maxTokens: number;
  useCache: boolean;
}

export interface AgentInput {
  manifest: Record<string, unknown>;
  chunks: Array<{ id: string; name: string; context: string }>;
  problemStatement?: string;
  readme?: string;
  options?: Record<string, unknown>;
}

export abstract class BaseAgent {
  abstract readonly config: AgentConfig;

  /**
   * Execute the agent's analysis.
   */
  abstract execute(input: AgentInput): Promise<Record<string, unknown>>;

  /**
   * Build the system prompt for this agent.
   */
  abstract buildSystemPrompt(): string;

  /**
   * Build the user prompt with context.
   */
  abstract buildUserPrompt(input: AgentInput): string;

  /**
   * Get the output schema for structured response.
   */
  abstract getOutputSchema(): Record<string, unknown>;

  /**
   * Run the agent with caching and error handling.
   */
  async run(input: AgentInput): Promise<AgentResult> {
    const startTime = Date.now();
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    // Generate cache key
    const cacheKey = aiCacheService.generateKey(
      this.config.name,
      systemPrompt + userPrompt,
      input.options
    );

    // Check cache
    if (this.config.useCache) {
      const cached = await aiCacheService.get(cacheKey);
      if (cached) {
        logger.info(`Cache hit for agent: ${this.config.name}`);
        return {
          agentName: this.config.name,
          status: "complete",
          completedAt: new Date().toISOString(),
          output: cached.output,
          confidence: this.calculateConfidence(cached.output),
          tokensUsed: 0,
        };
      }
    }

    try {
      const response = await callGeminiWithRetry({
        systemPrompt,
        userPrompt,
        outputSchema: this.getOutputSchema(),
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      });

      const output = JSON.parse(this.sanitizeJson(response.text));
      const tokensUsed = response.usage.promptTokens + response.usage.responseTokens;

      // Cache the result
      if (this.config.useCache) {
        await aiCacheService.set(cacheKey, this.config.name, cacheKey, output, tokensUsed);
      }

      logger.info(`Agent ${this.config.name} completed`, {
        tokensUsed,
        latencyMs: response.latencyMs,
      });

      return {
        agentName: this.config.name,
        status: "complete",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        output,
        confidence: this.calculateConfidence(output),
        tokensUsed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Agent ${this.config.name} failed`, { error: message });

      return {
        agentName: this.config.name,
        status: "failed",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        errorMessage: message,
        confidence: 0,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Calculate confidence based on output completeness.
   */
  protected calculateConfidence(output: Record<string, unknown>): number {
    if (!output || Object.keys(output).length === 0) return 0;
    const confidence = output.confidence as number | undefined;
    return confidence ?? 0.7;
  }

  /**
   * Sanitize JSON from Gemini response.
   */
  protected sanitizeJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    return cleaned.trim();
  }
}
