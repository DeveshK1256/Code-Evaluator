import { callGeminiWithRetry } from "@/lib/gemini/client";
import type { Finding, Risk, Recommendation, EvidenceItem } from "@/types/evaluation";

interface ModuleInputData {
  moduleName: string;
  moduleDescription: string;
  readme?: string;
  problemStatement?: string;
  repoContext: string;
  files?: Array<{ path: string; content: string }>;
}

interface AnalysisResult {
  strengths: Array<{ title: string; description: string; severity: string; category: string; evidence: string[] }>;
  weaknesses: Array<{ title: string; description: string; severity: string; category: string; evidence: string[] }>;
  risks: Array<{ title: string; description: string; likelihood: string; impact: string; mitigation: string }>;
  recommendations: Array<{ title: string; description: string; severity: string; suggestedFix: string; effort: string; scoreImprovement: number }>;
  score: number;
  summary: string;
}

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    strengths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          category: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
        },
        required: ["title", "description", "severity", "category"],
      },
    },
    weaknesses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          category: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
        },
        required: ["title", "description", "severity", "category"],
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          likelihood: { type: "string", enum: ["low", "medium", "high"] },
          impact: { type: "string", enum: ["low", "medium", "high"] },
          mitigation: { type: "string" },
        },
        required: ["title", "description", "likelihood", "impact", "mitigation"],
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          suggestedFix: { type: "string" },
          effort: { type: "string", enum: ["minutes", "hours", "days", "weeks"] },
          scoreImprovement: { type: "number" },
        },
        required: ["title", "description", "severity", "suggestedFix", "effort"],
      },
    },
    score: { type: "number" },
    summary: { type: "string" },
  },
  required: ["strengths", "weaknesses", "risks", "recommendations", "score", "summary"],
};

export async function analyzeWithGemini(input: ModuleInputData): Promise<AnalysisResult> {
  const filesSection = input.files?.length
    ? `\nKey Source Files:\n${input.files.map((f) => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`).join("\n\n")}`
    : "\nNo source files available for direct analysis.";

  const readmeSection = input.readme
    ? `\nREADME:\n${input.readme.slice(0, 3000)}`
    : "";

  const problemSection = input.problemStatement
    ? `\nProblem Statement:\n${input.problemStatement.slice(0, 2000)}`
    : "";

  const systemPrompt = `You are an expert software evaluator specializing in ${input.moduleName}.
Your role is to conduct a thorough, detailed analysis of a software project based on the given context.

${input.moduleDescription}

For each finding, provide SPECIFIC evidence from the code or context.
Be detailed and actionable. Do NOT be generic — reference actual file names, patterns, or code snippets.

Rules:
1. Strengths: Highlight what the project does well for this criteria. Be specific.
2. Weaknesses: Identify real issues or gaps. Reference specific files.
3. Risks: Identify genuine business/technical risks with likelihood and impact.
4. Recommendations: Provide concrete, actionable suggestions with effort estimates.
5. Score: Assign a score from 0-100 based on how well the project meets this criteria.
6. Summary: Write a 2-3 sentence summary of the overall evaluation for this criteria.`;

  const userPrompt = `Evaluate the following project for: ${input.moduleName}

Repository Context:${input.repoContext}${readmeSection}${problemSection}${filesSection}

Provide a detailed evaluation with specific strengths, weaknesses, risks, and actionable recommendations.
Be thorough and reference actual code patterns, file names, or project characteristics.`;

  try {
    const response = await callGeminiWithRetry({
      systemPrompt,
      userPrompt,
      outputSchema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });

    const parsed = JSON.parse(response.text) as AnalysisResult;

    return {
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      risks: parsed.risks ?? [],
      recommendations: parsed.recommendations ?? [],
      score: typeof parsed.score === "number" ? parsed.score : 65,
      summary: parsed.summary ?? `${input.moduleName} evaluation completed.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Gemini analysis failed for ${input.moduleName}, using fallback:`, message.slice(0, 200));

    // Generate contextual fallback based on module and repo info
    const repoName = input.repoContext.length > 50 ? "the project" : input.repoContext;
    const hasFiles = (input.files?.length ?? 0) > 0;
    const hasReadme = !!input.readme;
    const hasProblem = !!input.problemStatement;

    return {
      strengths: [
        { title: "Project Structure", description: `The project ${repoName} has a defined structure with ${input.files?.length ?? 0} files analyzed.`, severity: "medium", category: "structure", evidence: ["Codebase review"] },
        ...(hasReadme ? [{ title: "Documentation", description: "README documentation is provided, aiding understanding.", severity: "medium", category: "documentation", evidence: ["README present"] }] : []),
        ...(hasProblem ? [{ title: "Problem Definition", description: "Problem statement is clearly defined for evaluation context.", severity: "low", category: "requirements", evidence: ["Problem statement provided"] }] : []),
      ],
      weaknesses: [
        { title: "Comprehensive Analysis Pending", description: `Full AI-powered analysis was not available. Score is estimated based on available metadata. Enable a paid Gemini API tier for detailed analysis.`, severity: "medium", category: "analysis", evidence: ["Gemini quota exceeded"] },
        ...(hasFiles ? [] : [{ title: "Source Code Access", description: "Source files were not available for detailed review.", severity: "low", category: "analysis", evidence: ["No source files read"] }]),
      ],
      risks: [
        { title: "AI Analysis Limitations", description: "Detailed AI-driven risk assessment requires a paid Gemini API tier with higher rate limits.", likelihood: "medium", impact: "low", mitigation: "Upgrade Gemini API key for full analysis." },
      ],
      recommendations: [
        { title: "Upgrade Gemini API", description: "Enable billing in Google AI Studio to unlock full AI-powered evaluation with detailed findings.", severity: "medium", suggestedFix: "Go to https://ai.google.dev/gemini-api/docs/rate-limits to upgrade.", effort: "hours", scoreImprovement: 15 },
        { title: "Manual Code Review", description: "Perform a manual code review for comprehensive analysis while AI evaluation is limited.", severity: "low", suggestedFix: "Conduct peer review sessions for critical components.", effort: "days", scoreImprovement: 10 },
      ],
      score: 65,
      summary: `${input.moduleName} evaluation completed with estimated scoring. Upgrade Gemini API for detailed AI-powered analysis.`,
    };
  }
}

export function findingsToModuleFindings(
  items: Array<{ title: string; description: string; severity: string; category: string; evidence?: string[] }>,
  evidenceFn: (desc: string, filePath?: string, type?: "deterministic" | "inferred", confidence?: "high" | "medium" | "low") => EvidenceItem,
  findingFn: (title: string, description: string, severity: "critical" | "high" | "medium" | "low" | "info", evidence: EvidenceItem[], category: string) => Finding
): Finding[] {
  return items.map((item) =>
    findingFn(
      item.title,
      item.description,
      item.severity as "critical" | "high" | "medium" | "low" | "info",
      (item.evidence ?? ["Analysis completed"]).map((e) => evidenceFn(e)),
      item.category
    )
  );
}

export function recommendationsToModuleRecs(
  items: Array<{ title: string; description: string; severity: string; suggestedFix: string; effort: string; scoreImprovement?: number }>,
  moduleId: string
): Recommendation[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
    moduleId: moduleId as never,
    severity: item.severity as "critical" | "high" | "medium" | "low" | "info",
    confidence: "medium" as const,
    evidence: [],
    suggestedFix: item.suggestedFix,
    estimatedEffort: item.effort as "minutes" | "hours" | "days" | "weeks",
    expectedScoreImprovement: item.scoreImprovement ?? 5,
    priority: item.severity === "critical" ? 100 : item.severity === "high" ? 70 : item.severity === "medium" ? 40 : 15,
    roadmapPhase: item.severity === "critical" || item.severity === "high" ? "immediate" : item.severity === "medium" ? "next_sprint" : "future",
  }));
}
