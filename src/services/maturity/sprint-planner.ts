/**
 * Smart Sprint Planner
 *
 * Converts evaluation recommendations into an actionable sprint backlog.
 * Each task includes priority, effort, impact, dependencies, and suggested order.
 */

import type { Recommendation } from "@/types/evaluation";
import type { SprintPlan, SprintTask } from "@/types/maturity";

export class SprintPlanner {
  /**
   * Generate a sprint plan from recommendations.
   */
  plan(recommendations: Recommendation[], sprintName?: string): SprintPlan {
    const tasks: SprintTask[] = recommendations.map((rec, index) => ({
      id: `task-${index + 1}`,
      title: rec.title,
      description: rec.description,
      priority: rec.severity === "info" ? "low" : rec.severity,
      effort: rec.estimatedEffort,
      impact: rec.expectedScoreImprovement,
      dependencies: [],
      relatedFindings: rec.evidence.map((e) => e.description),
      suggestedOrder: rec.priority,
      category: rec.moduleId,
    }));

    // Sort by priority (critical -> high -> medium -> low)
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99;
      const pb = priorityOrder[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.impact - a.impact; // Within same priority, higher impact first
    });

    // Update suggested order
    tasks.forEach((t, i) => { t.suggestedOrder = i + 1; });

    // Estimate total effort
    const effortValues: Record<string, number> = { minutes: 0.5, hours: 4, days: 24, weeks: 120 };
    const totalHours = tasks.reduce((s, t) => s + (effortValues[t.effort] ?? 4), 0);
    const totalEffort = totalHours >= 120
      ? `${Math.round(totalHours / 120)} weeks`
      : totalHours >= 24
        ? `${Math.round(totalHours / 24)} days`
        : `${Math.round(totalHours)} hours`;

    const expectedImpact = tasks.reduce((s, t) => s + t.impact, 0);

    return {
      sprint: sprintName ?? `Sprint ${new Date().toLocaleDateString()}`,
      tasks,
      totalEffort,
      expectedImpact: Math.min(100, expectedImpact),
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Export sprint plan as markdown.
   */
  toMarkdown(plan: SprintPlan): string {
    const severityEmoji: Record<string, string> = {
      critical: "🔴", high: "🟠", medium: "🟡", low: "🟢", info: "ℹ️",
    };

    let md = `# Sprint Plan: ${plan.sprint}\n\n`;
    md += `**Total Effort:** ${plan.totalEffort} · `;
    md += `**Expected Impact:** +${plan.expectedImpact} points\n\n`;

    const grouped: Record<string, SprintTask[]> = {};
    for (const task of plan.tasks) {
      if (!grouped[task.priority]) grouped[task.priority] = [];
      grouped[task.priority]!.push(task);
    }

    for (const [priority, tasks] of Object.entries(grouped)) {
      md += `## ${severityEmoji[priority] ?? "📋"} ${priority.toUpperCase()}\n\n`;
      for (const task of tasks) {
        md += `### ${task.suggestedOrder}. ${task.title}\n`;
        md += `${task.description}\n\n`;
        md += `- **Effort:** ${task.effort}\n`;
        md += `- **Impact:** +${task.impact} points\n`;
        md += `- **Category:** ${task.category}\n`;
        if (task.relatedFindings.length > 0) {
          md += `- **Related findings:** ${task.relatedFindings.join(", ")}\n`;
        }
        md += "\n";
      }
    }

    return md;
  }

  /**
   * Export sprint plan as JSON.
   */
  toJSON(plan: SprintPlan): string {
    return JSON.stringify(plan, null, 2);
  }

  /**
   * Export sprint plan as CSV.
   */
  toCSV(plan: SprintPlan): string {
    const header = "Order,Priority,Title,Effort,Impact,Category";
    const rows = plan.tasks.map((t) =>
      `${t.suggestedOrder},${t.priority},"${t.title}",${t.effort},${t.impact},${t.category}`
    );
    return [header, ...rows].join("\n");
  }
}

export const sprintPlanner = new SprintPlanner();
