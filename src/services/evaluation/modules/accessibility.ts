import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";
import { analyzeWithGemini, findingsToModuleFindings, recommendationsToModuleRecs } from "@/services/evaluation/gemini-analysis";

export class AccessibilityModule extends BaseEvaluationModule {
  readonly moduleId = "accessibility" as const;
  readonly moduleName = "Accessibility";
  readonly description = "Evaluates WCAG compliance, screen reader support, keyboard navigation, color contrast, and inclusive design";
  readonly version = "1.0";

  async evaluate(input: ModuleInput): Promise<ModuleResult> { return this.buildResult(input); }

  private _g: Awaited<ReturnType<typeof analyzeWithGemini>> | null = null;
  private async g(input: ModuleInput) {
    if (!this._g) this._g = await analyzeWithGemini({ moduleName: this.moduleName, moduleDescription: this.description, repoContext: JSON.stringify(input.intelligence).slice(0, 2000), readme: input.readme, problemStatement: input.problemStatement, files: input.files });
    return this._g;
  }

  async buildStrengths(input: ModuleInput): Promise<Finding[]> {
    const a = await this.g(input); return findingsToModuleFindings(a.strengths, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c));
  }
  async buildWeaknesses(input: ModuleInput): Promise<Finding[]> {
    const a = await this.g(input); return findingsToModuleFindings(a.weaknesses, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c));
  }
  async buildRisks(input: ModuleInput): Promise<Risk[]> {
    const a = await this.g(input); return a.risks.map((r) => this.risk(r.title, r.description, r.likelihood as any, r.impact as any, r.mitigation));
  }
  async buildRecommendations(input: ModuleInput): Promise<Recommendation[]> {
    const a = await this.g(input); return recommendationsToModuleRecs(a.recommendations, this.moduleId);
  }
  calculateScore(_s: Finding[], _w: Finding[], _r: Risk[]): number { return this._g?.score ?? 50; }
}
