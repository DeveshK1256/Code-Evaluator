import { BaseEvaluationModule, type ModuleInput } from "@/services/evaluation/base-module";
import type { Finding, Risk, Recommendation, ModuleResult } from "@/types/evaluation";
import { getAnalysisForModule, getCachedScore, findingsToFindings, recsToModuleRecs } from "@/services/evaluation/gemini-analysis";
import { getAllEvaluationModules } from "@/services/evaluation/registry";

export class ProblemAlignmentModule extends BaseEvaluationModule {
  readonly moduleId = "problem_alignment" as const; readonly moduleName = "Problem Statement Alignment";
  readonly description = "Evaluates how well the implementation matches the problem statement, requirements, and project goals";
  readonly version = "1.0";
  async evaluate(input: ModuleInput): Promise<ModuleResult> { return this.buildResult(input); }
  private ctx(input: ModuleInput) { const a = getAllEvaluationModules(); return getAnalysisForModule(this.moduleId, a.map((m) => ({ id: m.moduleId, name: m.moduleName, description: m.description })), { repoContext: JSON.stringify(input.intelligence).slice(0, 2000), readme: input.readme, problemStatement: input.problemStatement, files: input.files }); }
  async buildStrengths(input: ModuleInput): Promise<Finding[]> { const r = await this.ctx(input); return findingsToFindings(r.strengths, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c)); }
  async buildWeaknesses(input: ModuleInput): Promise<Finding[]> { const r = await this.ctx(input); return findingsToFindings(r.weaknesses, (d, f, t, c) => this.evidence(d, f, t, c), (t, d, s, e, c) => this.finding(t, d, s, e, c)); }
  async buildRisks(input: ModuleInput): Promise<Risk[]> { const r = await this.ctx(input); return r.risks.map((rr) => this.risk(rr.title, rr.description, rr.likelihood as any, rr.impact as any, rr.mitigation)); }
  async buildRecommendations(input: ModuleInput): Promise<Recommendation[]> { const r = await this.ctx(input); return recsToModuleRecs(r.recommendations, this.moduleId); }
  calculateScore(_s: Finding[], _w: Finding[], _r: Risk[]): number { return getCachedScore(this.moduleId) ?? 50; }
}
