/**
 * AI client using Groq API (OpenAI-compatible).
 * Replaced Gemini due to free tier quota limitations.
 * Sign up at https://console.groq.com for a free API key.
 */
import { logger } from "@/lib/logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama3-70b-8192";
const MAX_RETRIES = 3;

interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  outputSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

interface AIResponse {
  text: string;
  usage: { promptTokens: number; responseTokens: number; totalTokens: number };
  latencyMs: number;
  model: string;
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Get a free key at https://console.groq.com");
  }

  const messages = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user" as const, content: request.userPrompt },
  ];

  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    messages,
    temperature: request.temperature ?? 0.3,
    max_tokens: request.maxOutputTokens ?? 4096,
  };

  // For structured output, use JSON mode
  if (request.outputSchema) {
    body.response_format = { type: "json_object" };
  }

  const startTime = Date.now();
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Groq API error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const latencyMs = Date.now() - startTime;
  const text = data.choices?.[0]?.message?.content ?? "";

  return {
    text,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      responseTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    latencyMs,
    model: DEFAULT_MODEL,
  };
}

export async function callAIWithRetry(request: AIRequest): Promise<AIResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callAI(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Don't retry auth errors
      if (lastError.message.includes("401") || lastError.message.includes("403")) throw lastError;
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(3, attempt) * 1000;
        logger.warn(`AI call failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error("AI call failed after all retries");
}
