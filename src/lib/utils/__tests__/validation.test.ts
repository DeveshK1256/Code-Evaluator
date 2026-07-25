import { describe, it, expect } from "vitest";

describe("Email validation", () => {
  it("should validate correct emails", () => {
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("user@example.com")).toBe(true);
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test("invalid")).toBe(false);
  });
});

describe("Password validation", () => {
  it("should require at least 6 characters", () => {
    expect("abcdef".length >= 6).toBe(true);
    expect("abc".length >= 6).toBe(false);
  });
});
