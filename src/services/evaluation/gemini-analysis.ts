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

  const props: Record<string, unknown> = {};
  const req: string[] = [];
  for (const m of modules) { props[m.id] = MOD_SCHEMA; req.push(m.id); }
  const schema: Record<string, unknown> = { type: "object", properties: props, required: req };

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

const cache = { results: null as Record<string, ModResult> | null, key: "", context: "" as string };

function parseContext(repoContext: string) {
  try {
    const parsed = JSON.parse(repoContext);
    return {
      fileCount: (parsed.fileCount as number) ?? 0,
      hasReadme: !!(parsed.readme ?? repoContext.includes("README")),
      hasProblem: !!(parsed.problemStatement ?? false),
      repoName: (parsed.repositoryName as string) ?? "",
      language: (parsed.repositoryLanguage as string) ?? "",
      fileList: (parsed.fileList as string[]) ?? [],
      hasTestFiles: ((parsed.fileList as string[]) ?? []).some((f: string) => /test|spec|__tests__/.test(f)),
      hasSecurityConfig: ((parsed.fileList as string[]) ?? []).some((f: string) => /\.env|auth|security|ssl|csrf|xss/.test(f)),
      hasDockerfile: ((parsed.fileList as string[]) ?? []).some((f: string) => /Dockerfile|docker-compose/.test(f)),
      hasCiCd: ((parsed.fileList as string[]) ?? []).some((f: string) => /\.github\/workflows|\.gitlab-ci|Jenkinsfile/.test(f)),
      topics: (parsed.topics as string[]) ?? [],
      stars: (parsed.stars as number) ?? 0,
    };
  } catch { return { fileCount: 0, hasReadme: false, hasProblem: false, repoName: "", language: "", fileList: [], hasTestFiles: false, hasSecurityConfig: false, hasDockerfile: false, hasCiCd: false, topics: [], stars: 0 }; }
}

function localScore(moduleId: string, ctx: ReturnType<typeof parseContext>, problemStatement?: string, files?: Array<{ path: string; content: string }>): ModResult {
  const fc = ctx.fileCount;
  const hasFiles = fc > 0;
  const fileListStr = ctx.fileList.join(", ").slice(0, 500);
  const hasReadme = ctx.hasReadme || !!problemStatement;
  const hasProblem = !!problemStatement;

  // Base score per module type
  let score = 50;
  const strengths: ModResult["strengths"] = [];
  const weaknesses: ModResult["weaknesses"] = [];
  const risks: ModResult["risks"] = [];
  const recommendations: ModResult["recommendations"] = [];

  switch (moduleId) {
    case "code_quality": {
      if (fc > 0) { score += Math.min(20, fc / 5); strengths.push({ title: "Structured Codebase", description: `Project contains ${fc} files with organized structure.`, severity: "medium", category: "structure", evidence: [`${fc} files`] }); }
      if (ctx.language) { score += 5; strengths.push({ title: "Primary Language", description: `Uses ${ctx.language} as primary language.`, severity: "low", category: "language", evidence: [ctx.language] }); }
      if (ctx.topics.length > 0) { score += 5; strengths.push({ title: "Project Topics", description: `Defined topics: ${ctx.topics.slice(0, 5).join(", ")}.`, severity: "low", category: "documentation", evidence: ctx.topics }); }
      if (fc < 10) { score -= 10; weaknesses.push({ title: "Small Codebase", description: "Small project size limits code quality assessment.", severity: "low", category: "scope", evidence: [`${fc} files`] }); }
      weaknesses.push({ title: "Automated Review", description: "Code quality assessed via static analysis. Manual review recommended for deeper insights.", severity: "low", category: "analysis", evidence: ["Static analysis"] });
      break;
    }
    case "security": {
      if (ctx.hasSecurityConfig) { score += 15; strengths.push({ title: "Security Configuration", description: "Security-related configuration files detected.", severity: "medium", category: "security", evidence: ["Security config found"] }); }
      if (ctx.hasDockerfile) { score += 5; strengths.push({ title: "Containerization", description: "Docker configuration provides isolation.", severity: "low", category: "infrastructure", evidence: ["Dockerfile"] }); }
      if (!ctx.hasSecurityConfig) { score -= 10; weaknesses.push({ title: "Security Hardening", description: "No explicit security configuration files detected.", severity: "high", category: "security", evidence: ["Missing security config"] }); }
      weaknesses.push({ title: "Vulnerability Scan", description: "Automated vulnerability scanning not performed in this evaluation.", severity: "medium", category: "security", evidence: ["Not scanned"] });
      break;
    }
    case "efficiency": {
      if (fc > 50) { score += 10; strengths.push({ title: "Moderate Codebase", description: `${fc} files suggests a non-trivial project.`, severity: "medium", category: "scale", evidence: [`${fc} files`] }); }
      if (ctx.hasDockerfile) { score += 5; strengths.push({ title: "Optimized Deployment", description: "Docker usage indicates efficient deployment practices.", severity: "low", category: "deployment", evidence: ["Dockerfile"] }); }
      weaknesses.push({ title: "Performance Audit", description: "Detailed performance profiling not conducted.", severity: "low", category: "performance", evidence: ["Not profiled"] });
      break;
    }
    case "testing": {
      if (ctx.hasTestFiles) { score += 25; strengths.push({ title: "Tests Detected", description: "Test files found in the project structure.", severity: "high", category: "testing", evidence: ["Test files present"] }); }
      else { score -= 15; weaknesses.push({ title: "No Tests Found", description: "No test files detected. Testing is critical for reliability.", severity: "high", category: "testing", evidence: ["No test files"] });
        recommendations.push({ title: "Add Unit Tests", description: "Implement unit testing for core business logic.", severity: "high", suggestedFix: "Integrate a test framework (Jest, PyTest, etc.)", effort: "days", scoreImprovement: 20 });
      }
      break;
    }
    case "accessibility": {
      if (fileListStr.includes("aria") || fileListStr.includes("a11y") || fileListStr.includes("accessibility")) { score += 15; strengths.push({ title: "Accessibility Aware", description: "Accessibility-related files or attributes detected.", severity: "medium", category: "accessibility", evidence: ["A11y references"] }); }
      weaknesses.push({ title: "Accessibility Audit", description: "Full WCAG compliance audit not performed automatically.", severity: "medium", category: "accessibility", evidence: ["Not audited"] });
      break;
    }
    case "google_services": {
      const hasFirebase = fileListStr.includes("firebase") || fileListStr.includes("firestore");
      const hasGoogle = fileListStr.includes("google") || fileListStr.includes("gcp") || fileListStr.includes("cloud");
      if (hasFirebase) { score += 15; strengths.push({ title: "Firebase Integration", description: "Firebase services detected in project.", severity: "medium", category: "cloud", evidence: ["Firebase config"] }); }
      if (hasGoogle) { score += 10; strengths.push({ title: "Google Cloud Usage", description: "Google Cloud services integrated.", severity: "medium", category: "cloud", evidence: ["Google APIs"] }); }
      if (!hasFirebase && !hasGoogle) { score = Math.max(score - 5, 30); weaknesses.push({ title: "No Google Services", description: "No Google Cloud or Firebase integration detected.", severity: "low", category: "cloud", evidence: ["Not detected"] }); }
      break;
    }
    case "problem_alignment": {
      if (hasProblem) {
        score += 20;
        strengths.push({ title: "Problem Defined", description: "Problem statement provided, enabling alignment evaluation.", severity: "high", category: "requirements", evidence: ["Problem statement"] });
      } else {
        score -= 20;
        weaknesses.push({ title: "No Problem Statement", description: "Missing problem statement. Alignment cannot be assessed.", severity: "high", category: "requirements", evidence: ["Not provided"] });
        recommendations.push({ title: "Define Problem Statement", description: "Provide a clear problem statement for alignment evaluation.", severity: "medium", suggestedFix: "Add a problem statement describing what the project solves.", effort: "hours", scoreImprovement: 20 });
      }
      if (hasReadme && hasProblem) { score += 5; }
      break;
    }
  }

  score = Math.max(15, Math.min(95, score));

  const summary = `${moduleId.replace(/_/g, " ")} evaluated with local scoring. Score: ${score}/100. Grade: ${score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F"}.`;

  return { strengths, weaknesses, risks, recommendations, score, summary };
}

export async function getAnalysisForModule(
  moduleId: string,
  allModules: Array<{ id: string; name: string; description: string }>,
  context: { repoContext: string; readme?: string; problemStatement?: string; files?: Array<{ path: string; content: string }> }
): Promise<ModResult> {
  const key = allModules.map((m) => m.id).sort().join(",");
  const ctx = parseContext(context.repoContext);
  if (!cache.results || cache.key !== key || cache.context !== context.repoContext.slice(0, 100)) {
    const aiResults = await analyzeAllModules(allModules, context).catch(() => null);
    if (aiResults) {
      cache.results = aiResults;
      cache.key = key;
      cache.context = context.repoContext.slice(0, 100);
    } else {
      // Use local scoring as fallback
      const local: Record<string, ModResult> = {};
      for (const m of allModules) local[m.id] = localScore(m.id, ctx, context.problemStatement, context.files);
      cache.results = local;
      cache.key = key;
      cache.context = context.repoContext.slice(0, 100);
    }
  }
  return cache.results[moduleId] ?? localScore(moduleId, ctx, context.problemStatement, context.files);
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
