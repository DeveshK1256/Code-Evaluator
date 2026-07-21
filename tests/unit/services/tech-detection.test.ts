import { describe, it, expect } from "vitest";
import { TechDetectionService } from "@/services/tech-detection.service";

const service = new TechDetectionService();

describe("TechDetectionService", () => {
  it("detects TypeScript from .ts files", async () => {
    const result = await service.detect(["src/index.ts", "src/app.tsx"], async () => null);
    expect(result.items.some((t) => t.name === "TypeScript")).toBe(true);
  });

  it("detects Python from .py files", async () => {
    const result = await service.detect(["main.py", "utils.py"], async () => null);
    expect(result.items.some((t) => t.name === "Python")).toBe(true);
  });

  it("detects Next.js from package.json", async () => {
    const result = await service.detect(
      ["package.json"],
      async (path) => path === "package.json" ? JSON.stringify({ dependencies: { next: "15.0.0" } }) : null
    );
    expect(result.items.some((t) => t.name === "Next.js")).toBe(true);
  });

  it("detects React from package.json", async () => {
    const result = await service.detect(
      ["package.json"],
      async (path) => path === "package.json" ? JSON.stringify({ dependencies: { react: "19.0.0" } }) : null
    );
    expect(result.items.some((t) => t.name === "React")).toBe(true);
  });

  it("detects Docker from Dockerfile", async () => {
    const result = await service.detect(["Dockerfile"], async () => null);
    expect(result.items.some((t) => t.name === "Docker")).toBe(true);
  });

  it("detects GitHub Actions from workflow files", async () => {
    const result = await service.detect([".github/workflows/ci.yml"], async () => null);
    expect(result.items.some((t) => t.name === "GitHub Actions")).toBe(true);
  });

  it("groups technologies by category", async () => {
    const result = await service.detect(
      ["src/index.ts", "package.json", "Dockerfile"],
      async (path) => path === "package.json" ? JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" } }) : null
    );
    expect(result.categories["language"]).toBeDefined();
    expect(result.categories["framework"]).toBeDefined();
    expect(result.categories["infrastructure"]).toBeDefined();
  });

  it("returns no duplicates for the same technology", async () => {
    const result = await service.detect(
      ["src/index.ts", "src/app.tsx", "src/component.tsx"],
      async () => null
    );
    const tsItems = result.items.filter((t) => t.name === "TypeScript");
    expect(tsItems.length).toBe(1);
  });

  it("handles empty file list", async () => {
    const result = await service.detect([], async () => null);
    expect(result.items).toEqual([]);
    expect(Object.keys(result.categories).length).toBe(0);
  });
});
