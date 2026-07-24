import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";
import { analyzeWithGemini, findingsToModuleFindings, recommendationsToModuleRecs } from "@/services/evaluation/gemini-analysis";

export class CodeQualityModule extends BaseEvaluationModule {
  readonly moduleId = "code_quality" as const;
  readonly moduleName = "Code Quality";
  readonly description = "Evaluates code structure, naming conventions, SOLID principles, DRY, complexity, and maintainability";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> {
    return this.buildResult(input);
  }

  private geminiCache: Awaited<ReturnType<typeof analyzeWithGemini>> | null = null;

  private async getGeminiAnalysis(input: ModuleInput) {
    if (!this.geminiCache) {
      this.geminiCache = await analyzeWithGemini({
        moduleName: this.moduleName,
        moduleDescription: this.description,
        repoContext: JSON.stringify(input.intelligence, null, 2).slice(0, 2000),
        readme: input.readme,
        problemStatement: input.problemStatement,
        files: input.files,
      });
    }
    return this.geminiCache;
  }

  async buildStrengths(input: ModuleInput): Promise<Finding[]> {
    const a = await this.getGeminiAnalysis(input);
    return findingsToModuleFindings(a.strengths, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c));
  }

  async buildWeaknesses(input: ModuleInput): Promise<Finding[]> {
    const a = await this.getGeminiAnalysis(input);
    return findingsToModuleFindings(a.weaknesses, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c));
  }

  async buildRisks(input: ModuleInput): Promise<Risk[]> {
    const a = await this.getGeminiAnalysis(input);
    return a.risks.map((r) => this.risk(r.title, r.description, r.likelihood as "low" | "medium" | "high", r.impact as "low" | "medium" | "high", r.mitigation));
  }

  async buildRecommendations(input: ModuleInput): Promise<Recommendation[]> {
    const a = await this.getGeminiAnalysis(input);
    return recommendationsToModuleRecs(a.recommendations, this.moduleId);
  }

  calculateScore(_strengths: Finding[], _weaknesses: Finding[], _risks: Risk[]): number {
    return this.geminiCache?.score ?? 50;
  }
}
