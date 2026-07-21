/**
 * Gemini AI Integration
 *
 * This module is configured but intentionally left without analysis logic.
 * It will be implemented in Prompt 3 — Analysis Pipeline & AI Evaluation.
 *
 * Dependencies:
 * - @google/generative-ai (installed)
 * - GEMINI_API_KEY environment variable
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerEnv } from "@/lib/utils/env";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) return genAI;

  const env = getServerEnv();
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI;
}

export const GEMINI_MODELS = {
  PRO: "gemini-2.5-pro-exp-03-25",
  FLASH: "gemini-2.0-flash",
} as const;

/**
 * Placeholder for future AI analysis functions.
 * These will be implemented when the evaluation pipeline is built.
 */

export type { GenerativeModel } from "@google/generative-ai";
