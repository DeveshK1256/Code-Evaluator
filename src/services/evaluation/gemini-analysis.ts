import { callGeminiWithRetry } from "@/lib/gemini/client";
import type { Finding, Risk, Recommendation, EvidenceItem } from "@/types/evaluation";

export interface ModResult {
  strengths: Array<{ title: string; description: string; severity: string; category: string; evidence: string[] }>;
  weaknesses: Array<{ title: string; description: string; severity: string; category: string; evidence: string[] }>;
  risks: Array<{ title: string; description: string; likelihood: string; impact: string; mitigation: string }>;
  recommendations: Array<{ title: string; description: string; severity: string; suggestedFix: string; effort: string; scoreImprovement: number }>;
  score: number;
  summary: string;
}

const MOD_SCHEMA = {
  type: "object", properties: {
    strengths: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, description: { type: "string" },
      severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
      category: { type: "string" }, evidence: { type: "array", items: { type: "string" } },
    }, required: ["title", "description", "severity", "category"] } },
    weaknesses: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, description: { type: "string" },
      severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
      category: { type: "string" }, evidence: { type: "array", items: { type: "string" } },
    }, required: ["title", "description", "severity", "category"] } },
    risks: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, description: { type: "string" },
      likelihood: { type: "string", enum: ["low", "medium", "high"] },
      impact: { type: "string", enum: ["low", "medium", "high"] },
      mitigation: { type: "string" },
    }, required: ["title", "description", "likelihood", "impact", "mitigation"] } },
    recommendations: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, description: { type: "string" },
      severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
      suggestedFix: { type: "string" },
      effort: { type: "string", enum: ["minutes", "hours", "days", "weeks"] },
      scoreImprovement: { type: "number" },
    }, required: ["title", "description", "severity", "suggestedFix", "effort"] } },
    score: { type: "number" }, summary: { type: "string" },
  },
  required: ["strengths", "weaknesses", "risks", "recommendations", "score", "summary"],
};

// ─── Batch all modules into ONE Gemini call ────────────────────

export async function analyzeAllModules(
  modules: Array<{ id: string; name: string; description: string }>,
  context: { repoContext: string; readme?: string; problemStatement?: string; files?: Array<{ path: string; content: string }> }
): Promise<Record<string, ModResult>> {
  const filesSection = context.files?.length
    ? `\nKey source files:\n${context.files.map((f) => `--- ${f.path} ---\n${f.content.slice(0, 1200)}`).join("\n\n")}`
    : "";

  const systemPrompt = `You are an expert software evaluator. Analyze this project across ALL these criteria in ONE response:

${modules.map((m) => `- ${m.id}: ${m.name} — ${m.description}`).join("\n")}

For each criteria, provide: strengths (specific, with evidence), weaknesses, risks (likelihood & impact), recommendations (with effort), a score (0-100), and a summary. Be specific — reference actual code patterns, file names, or project characteristics.`;

  const userPrompt = `Evaluate this project across ${modules.length} criteria.

Repository:${context.repoContext.slice(0, 1500)}
${context.readme ? `README:\n${context.readme.slice(0, 2000)}` : ""}
${context.problemStatement ? `Problem:\n${context.problemStatement.slice(0, 1500)}` : ""}
${filesSection}

Return valid JSON with one key per criteria containing all fields.`;

  const schema: Record<string, unknown> = { type: "object", properties: {}, required: [] as string[] };
  for (const m of modules) {
    schema.properties![m.id] = MOD_SCHEMA;
    (schema.required as string[]).push(m.id);
  }

  try {
    const response = await callGeminiWithRetry({
      systemPrompt, userPrompt,
      outputSchema: schema, temperature: 0.3, maxOutputTokens: 8192,
    });
    const parsed = JSON.parse(response.text) as Record<string, unknown>;
    const results: Record<string, ModResult> = {};
    for (const m of modules) {
      const d = parsed[m.id] as Record<string, unknown> | undefined;
      if (d && typeof d.score === "number") {
        results[m.id] = {
          strengths: (d.strengths ?? []) as ModResult["strengths"],
          weaknesses: (d.weaknesses ?? []) as ModResult["weaknesses"],
          risks: (d.risks ?? []) as ModResult["risks"],
          recommendations: (d.recommendations ?? []) as ModResult["recommendations"],
          score: d.score as number, summary: (d.summary as string) ?? "",
        };
      } else {
        results[m.id] = fallback(m.name);
      }
    }
    return results;
  } catch {
    const results: Record<string, ModResult> = {};
    for (const m of modules) results[m.id] = fallback(m.name);
    return results;
  }
}

function fallback(name: string): ModResult {
  return {
    strengths: [{ title: "Project Structure", description: "Project files analyzed for structure and organization.", severity: "medium", category: "structure", evidence: ["Codebase review"] }],
    weaknesses: [{ title: "AI Analysis Unavailable", description: "Detailed AI analysis could not be completed. Score estimated.", severity: "medium", category: "analysis", evidence: ["API limit"] }],
    risks: [{ title: "Analysis Depth", description: "Estimated scoring may not reflect all issues.", likelihood: "medium", impact: "medium", mitigation: "Consider manual review." }],
    recommendations: [{ title: "Enable Full AI", description: "Upgrade Gemini API for detailed analysis.", severity: "medium", suggestedFix: "Enable billing at ai.google.dev", effort: "hours", scoreImprovement: 15 }],
    score: 65, summary: `${name} evaluated with estimated score (AI analysis unavailable).`,
  };
}

// ─── Thread-safe cache for modules ────────────────────────────
// The orchestrator triggers the batch call once, modules read from cache.

const cache = { results: null as Record<string, ModResult> | null, key: "" };

export async function getAnalysisForModule(
  moduleId: string,
  allModules: Array<{ id: string; name: string; description: string }>,
  context: { repoContext: string; readme?: string; problemStatement?: string; files?: Array<{ path: string; content: string }> }
): Promise<ModResult> {
  const key = allModules.map((m) => m.id).sort().join(",");
  if (!cache.results || cache.key !== key) {
    cache.results = await analyzeAllModules(allModules, context);
    cache.key = key;
  }
  return cache.results[moduleId] ?? fallback(moduleId);
}

export function getCachedScore(moduleId: string): number | null {
  return cache.results?.[moduleId]?.score ?? null;
}

// ─── Helpers for module integration ───────────────────────────

export function findingsToFindings(
  items: Array<{ title: string; description: string; severity: string; category: string; evidence?: string[] }>,
  evidenceFn: (desc: string, filePath?: string, type?: "deterministic" | "inferred", confidence?: "high" | "medium" | "low") => EvidenceItem,
  findingFn: (title: string, description: string, severity: "critical" | "high" | "medium" | "low" | "info", evidence: EvidenceItem[], category: string) => Finding
): Finding[] {
  return items.map((i) => findingFn(i.title, i.description, i.severity as any, (i.evidence ?? []).map((e) => evidenceFn(e)), i.category));
}

export function recsToModuleRecs(items: ModResult["recommendations"], moduleId: string): Recommendation[] {
  return items.map((i) => ({
    title: i.title, description: i.description, moduleId: moduleId as never,
    severity: i.severity as any, confidence: "medium" as const, evidence: [],
    suggestedFix: i.suggestedFix, estimatedEffort: i.effort as any,
    expectedScoreImprovement: i.scoreImprovement ?? 5,
    priority: i.severity === "critical" ? 100 : i.severity === "high" ? 70 : i.severity === "medium" ? 40 : 15,
    roadmapPhase: i.severity === "critical" || i.severity === "high" ? "immediate" : "next_sprint",
  }));
}
