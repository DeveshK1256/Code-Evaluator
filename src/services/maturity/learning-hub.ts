/**
 * Learning Hub
 *
 * Generates personalized learning resources based on evaluation findings.
 * Each recommendation is contextual to the user's specific gaps.
 */

import type { ModuleResult } from "@/types/evaluation";
import type { LearningResource, ResourceItem } from "@/types/maturity";

const RESOURCE_LIBRARY: Record<string, Array<{ minScore: number; resources: ResourceItem[]; nextSteps: string[] }>> = {
  testing: [
    {
      minScore: 0,
      resources: [
        { title: "Testing Best Practices", type: "documentation", description: "Comprehensive guide to testing strategies", priority: "recommended" },
        { title: "Jest Documentation", type: "documentation", description: "Official Jest testing framework docs", priority: "recommended" },
        { title: "Testing Trophy Pattern", type: "tutorial", description: "Move beyond the testing pyramid", priority: "optional" },
      ],
      nextSteps: ["Add unit tests for core business logic", "Set up CI with test runner", "Add integration tests for API routes"],
    },
    {
      minScore: 60,
      resources: [
        { title: "Advanced Testing Patterns", type: "course", description: "Integration, E2E, and property-based testing", priority: "recommended" },
      ],
      nextSteps: ["Add E2E tests for critical user flows", "Implement visual regression testing", "Set up coverage thresholds"],
    },
  ],
  security: [
    {
      minScore: 0,
      resources: [
        { title: "OWASP Top 10", type: "documentation", description: "Official OWASP Top 10 Web Security Risks", priority: "critical" },
        { title: "Secure Coding Practices", type: "course", description: "Fundamentals of secure software development", priority: "recommended" },
      ],
      nextSteps: ["Implement input validation on all routes", "Add security headers", "Run dependency audit"],
    },
    {
      minScore: 60,
      resources: [
        { title: "Advanced Web Security", type: "book", description: "Deep dive into web application security", priority: "recommended" },
      ],
      nextSteps: ["Implement CSP with strict policies", "Add rate limiting", "Set up security monitoring"],
    },
  ],
  accessibility: [
    {
      minScore: 0,
      resources: [
        { title: "WCAG 2.2 Guidelines", type: "documentation", description: "Official Web Content Accessibility Guidelines", priority: "critical" },
        { title: "Axe Core Documentation", type: "tool", description: "Automated accessibility testing tool", priority: "recommended" },
      ],
      nextSteps: ["Add alt text to all images", "Ensure keyboard navigation", "Fix color contrast issues"],
    },
    {
      minScore: 60,
      resources: [
        { title: "Inclusive Design Principles", type: "course", description: "Designing for all users", priority: "recommended" },
      ],
      nextSteps: ["Implement screen reader testing", "Add focus indicators", "Test with assistive technologies"],
    },
  ],
  performance: [
    {
      minScore: 0,
      resources: [
        { title: "Web Vitals Guide", type: "documentation", description: "Core Web Vitals optimization guide", priority: "critical" },
        { title: "Next.js Performance", type: "documentation", description: "Next.js performance optimization docs", priority: "recommended" },
      ],
      nextSteps: ["Optimize images and fonts", "Implement lazy loading", "Add code splitting"],
    },
  ],
};

export class LearningHub {
  /**
   * Generate personalized learning resources from evaluation results.
   */
  generate(moduleResults: ModuleResult[]): LearningResource[] {
    const resources: LearningResource[] = [];

    const categoryMap: Record<string, string> = {
      testing: "Testing Practices",
      security: "Security",
      accessibility: "Accessibility",
      performance: "Performance",
      code_quality: "Code Quality",
      documentation: "Documentation",
      architecture: "Architecture",
      devops: "DevOps",
      google_services: "Google Cloud",
      ai_integration: "AI Engineering",
    };

    for (const result of moduleResults) {
      const category = categoryMap[result.moduleId];
      if (!category) continue;

      const tiers = RESOURCE_LIBRARY[result.moduleId] ?? [];
      const applicableTier = tiers
        .slice()
        .reverse()
        .find((t) => result.score >= t.minScore);

      const resources_items = applicableTier?.resources ?? [];
      const nextSteps = applicableTier?.nextSteps ?? [];

      resources.push({
        topic: category,
        category: result.moduleId,
        currentLevel: result.score >= 70 ? "Intermediate" : result.score >= 40 ? "Beginner" : "Foundation",
        recommendedResources: resources_items,
        nextSteps,
        estimatedTimeToImprove: result.score < 40 ? "2-3 weeks" : result.score < 70 ? "1-2 weeks" : "3-5 days",
      });
    }

    return resources;
  }
}

export const learningHub = new LearningHub();
