import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/lib/utils/env";
import { logger } from "@/lib/logger";

const DEFAULT_MODEL = "gemini-2.5-pro-exp-03-25";
const MAX_RETRIES = 3;

interface GeminiRequest {
  systemPrompt: string;
  userPrompt: string;
  outputSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  text: string;
  usage: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
}

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (genAI) return genAI;
  const env = getServerEnv();
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI;
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxOutputTokens ?? 8192,
      responseMimeType: request.outputSchema ? "application/json" : "text/plain",
      ...(request.outputSchema ? { responseSchema: request.outputSchema } : {}),
    },
  });

  const startTime = Date.now();

  const contents = [
    ...(request.systemPrompt ? [{ role: "user" as const, parts: [{ text: request.systemPrompt }] }] : []),
    { role: "user" as const, parts: [{ text: request.userPrompt }] },
  ];

  const result = await model.generateContent({ contents });
  const latencyMs = Date.now() - startTime;

  const response = result.response;
  const text = response.text();
  const usage = {
    promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
    responseTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
  };

  return { text, usage, latencyMs, model: DEFAULT_MODEL };
}

export async function callGeminiWithRetry(request: GeminiRequest): Promise<GeminiResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callGemini(request);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(3, attempt) * 1000;
        logger.warn(`Gemini call failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Gemini call failed after all retries");
}
