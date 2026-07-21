import type { TechnologyItem } from "@/types/repository";

interface DetectionRule {
  name: string;
  category: TechnologyItem["category"];
  detect: (files: string[], content: Record<string, string>) => boolean;
  confidence: number;
}

export class TechDetectionService {
  private rules: DetectionRule[] = [
    // ─── Languages ─────────────────────────────────────────────
    this.rule("TypeScript", "language", (files) =>
      files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"))),
    this.rule("JavaScript", "language", (files) =>
      files.some((f) => f.endsWith(".js") || f.endsWith(".jsx") || f.endsWith(".mjs"))),
    this.rule("Python", "language", (files) =>
      files.some((f) => f.endsWith(".py"))),
    this.rule("Java", "language", (files) =>
      files.some((f) => f.endsWith(".java"))),
    this.rule("Go", "language", (files) =>
      files.some((f) => f === "go.mod" || f.endsWith(".go"))),
    this.rule("Rust", "language", (files) =>
      files.some((f) => f === "Cargo.toml" || f.endsWith(".rs"))),
    this.rule("C#", "language", (files) =>
      files.some((f) => f.endsWith(".cs") || f.endsWith(".csproj"))),
    this.rule("PHP", "language", (files) =>
      files.some((f) => f.endsWith(".php"))),
    this.rule("Dart", "language", (files) =>
      files.some((f) => f.endsWith(".dart"))),
    this.rule("Kotlin", "language", (files) =>
      files.some((f) => f.endsWith(".kt") || f.endsWith(".kts"))),
    this.rule("Ruby", "language", (files) =>
      files.some((f) => f.endsWith(".rb") || f === "Gemfile")),
    this.rule("Swift", "language", (files) =>
      files.some((f) => f.endsWith(".swift"))),

    // ─── Frontend Frameworks ──────────────────────────────────
    this.rule("Next.js", "framework", (_, content) =>
      !!content["package.json"]?.includes('"next"'), 0.95),
    this.rule("React", "framework", (_, content) =>
      !!content["package.json"]?.includes('"react"'), 0.9),
    this.rule("Vue.js", "framework", (_, content) =>
      !!content["package.json"]?.includes('"vue"'), 0.9),
    this.rule("Angular", "framework", (files, content) =>
      !!content["package.json"]?.includes('"@angular/core"') ||
      files.some((f) => f.endsWith(".component.ts")), 0.9),
    this.rule("Svelte", "framework", (files) =>
      files.some((f) => f.endsWith(".svelte")), 0.9),
    this.rule("Flutter", "framework", (files) =>
      files.some((f) => f === "pubspec.yaml"), 0.95),

    // ─── Backend Frameworks ───────────────────────────────────
    this.rule("Express", "framework", (_, content) =>
      !!content["package.json"]?.includes('"express"'), 0.85),
    this.rule("NestJS", "framework", (_, content) =>
      !!content["package.json"]?.includes('"@nestjs/core"'), 0.9),
    this.rule("FastAPI", "framework", (_, content) =>
      !!content["requirements.txt"]?.includes("fastapi"), 0.85),
    this.rule("Django", "framework", (_, content) =>
      !!content["requirements.txt"]?.includes("django") ||
      !!content["pyproject.toml"]?.includes("django"), 0.85),
    this.rule("Flask", "framework", (_, content) =>
      !!content["requirements.txt"]?.includes("flask"), 0.8),
    this.rule("Spring Boot", "framework", (files) =>
      files.some((f) => f.includes("pom.xml") || f.includes("build.gradle")), 0.8),
    this.rule("Laravel", "framework", (files) =>
      files.some((f) => f === "artisan" || f === "composer.json"), 0.85),

    // ─── Databases ────────────────────────────────────────────
    this.rule("PostgreSQL", "database", (_, content) =>
      !!content["package.json"]?.includes("pg") ||
      !!content["package.json"]?.includes("postgres") ||
      !!content["package.json"]?.includes("prisma") ||
      !!content["requirements.txt"]?.includes("psycopg2"), 0.7),
    this.rule("MongoDB", "database", (_, content) =>
      !!content["package.json"]?.includes("mongoose") ||
      !!content["package.json"]?.includes("mongodb"), 0.8),
    this.rule("MySQL", "database", (_, content) =>
      !!content["package.json"]?.includes("mysql") ||
      !!content["requirements.txt"]?.includes("mysql"), 0.7),
    this.rule("SQLite", "database", (_, content) =>
      !!content["package.json"]?.includes("sqlite3") ||
      !!content["requirements.txt"]?.includes("sqlite"), 0.6),
    this.rule("Firebase", "database", (files, content) =>
      !!content["package.json"]?.includes("firebase") ||
      files.some((f) => f === "firebase.json" || f === "firestore.rules"), 0.85),
    this.rule("Supabase", "database", (_, content) =>
      !!content["package.json"]?.includes("@supabase"), 0.85),

    // ─── Infrastructure ───────────────────────────────────────
    this.rule("Docker", "infrastructure", (files) =>
      files.some((f) => f === "Dockerfile" || f.startsWith("docker-compose")), 0.95),
    this.rule("Kubernetes", "infrastructure", (files) =>
      files.some((f) => f.startsWith("k8s/") || f.startsWith("K8s/") || f.endsWith(".k8s.yaml")), 0.85),
    this.rule("Terraform", "infrastructure", (files) =>
      files.some((f) => f.endsWith(".tf")), 0.9),
    this.rule("GitHub Actions", "ci_cd", (files) =>
      files.some((f) => f.startsWith(".github/workflows/")), 0.95),
    this.rule("Vercel", "hosting", (files) =>
      files.some((f) => f === "vercel.json") ||
      !!files.find((f) => f === ".vercel"), 0.7),
    this.rule("Netlify", "hosting", (files) =>
      files.some((f) => f === "netlify.toml"), 0.8),

    // ─── Tools ────────────────────────────────────────────────
    this.rule("Prisma", "tool", (_, content) =>
      !!content["package.json"]?.includes("prisma") ||
      !!content["package.json"]?.includes("@prisma/client"), 0.9),
    this.rule("Jest", "tool", (_, content) =>
      !!content["package.json"]?.includes("jest"), 0.9),
    this.rule("Vitest", "tool", (_, content) =>
      !!content["package.json"]?.includes("vitest"), 0.9),
    this.rule("Playwright", "tool", (_, content) =>
      !!content["package.json"]?.includes("@playwright/test"), 0.9),
    this.rule("ESLint", "tool", (_, content) =>
      !!content["package.json"]?.includes("eslint"), 0.85),
    this.rule("Prettier", "tool", (_, content) =>
      !!content["package.json"]?.includes("prettier"), 0.8),
    this.rule("Tailwind CSS", "tool", (_, content) =>
      !!content["package.json"]?.includes("tailwindcss"), 0.9),
    this.rule("shadcn/ui", "tool", (files) =>
      files.some((f) => f === "components.json"), 0.85),
    this.rule("Inngest", "tool", (_, content) =>
      !!content["package.json"]?.includes("inngest"), 0.9),
  ];

  /**
   * Detect technologies used in a repository.
   */
  async detect(
    files: string[],
    readFileContent: (filePath: string) => Promise<string | null>
  ): Promise<{
    items: TechnologyItem[];
    categories: Record<string, TechnologyItem[]>;
  }> {
    // Read key config files for content-based detection
    const configFiles = [
      "package.json", "requirements.txt", "pyproject.toml",
      "composer.json", "Gemfile", "pubspec.yaml", "go.mod",
      "Cargo.toml", "build.gradle", "pom.xml",
    ];

    const content: Record<string, string> = {};
    for (const cf of configFiles) {
      if (files.includes(cf)) {
        const text = await readFileContent(cf);
        if (text) content[cf] = text;
      }
    }

    // Run all detection rules
    const items: TechnologyItem[] = [];
    for (const rule of this.rules) {
      if (rule.detect(files, content)) {
        items.push({
          name: rule.name,
          category: rule.category,
          confidence: rule.confidence,
        });
      }
    }

    // Also detect from file extensions as fallback
    this.detectFromExtensions(files, items);

    // Deduplicate by name
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      const key = `${item.category}:${item.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Group by category
    const categories: Record<string, TechnologyItem[]> = {};
    for (const item of unique) {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category]!.push(item);
    }

    return { items: unique, categories };
  }

  private detectFromExtensions(files: string[], items: TechnologyItem[]): void {
    const extensionCounts: Record<string, number> = {};
    for (const file of files) {
      const dot = file.lastIndexOf(".");
      if (dot > 0) {
        const ext = file.slice(dot).toLowerCase();
        extensionCounts[ext] = (extensionCounts[ext] ?? 0) + 1;
      }
    }

    // Use extension counts to confirm language detections
    if ((extensionCounts[".ts"] ?? 0) > 5 && !items.some((i) => i.name === "TypeScript")) {
      items.push({ name: "TypeScript", category: "language", confidence: 0.8 });
    }
    if ((extensionCounts[".js"] ?? 0) > 5 && !items.some((i) => i.name === "JavaScript")) {
      items.push({ name: "JavaScript", category: "language", confidence: 0.7 });
    }
    if ((extensionCounts[".py"] ?? 0) > 5 && !items.some((i) => i.name === "Python")) {
      items.push({ name: "Python", category: "language", confidence: 0.7 });
    }
  }

  private rule(
    name: string,
    category: TechnologyItem["category"],
    detect: (files: string[], content: Record<string, string>) => boolean,
    confidence: number = 0.8
  ): DetectionRule {
    return { name, category, detect, confidence };
  }
}

export const techDetectionService = new TechDetectionService();
