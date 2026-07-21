import { describe, it, expect } from "vitest";

describe("Project Setup", () => {
  it("should have the correct test infrastructure", () => {
    expect(true).toBe(true);
  });

  it("should support basic math", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async operations", async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
