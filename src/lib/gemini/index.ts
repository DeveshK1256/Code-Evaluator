/**
 * AI Integration
 * Uses Groq API (OpenAI-compatible) for AI-powered evaluation.
 * Get a free API key at https://console.groq.com
 */

export function getAIClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY not set. Get a free key at https://console.groq.com");
  }
  return { apiKey: key, baseUrl: "https://api.groq.com/openai/v1" };
}

export { callAI, callAIWithRetry } from "./client";
