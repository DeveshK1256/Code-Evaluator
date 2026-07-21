import { describe, it, expect } from "vitest";
import { GitHubService } from "@/services/github.service";

const service = new GitHubService();

describe("GitHubService.parseUrl", () => {
  it("parses standard GitHub URL", () => {
    const result = service.parseUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: undefined });
  });

  it("parses URL with branch", () => {
    const result = service.parseUrl("https://github.com/owner/repo/tree/main");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "main" });
  });

  it("parses URL with branch containing slashes", () => {
    const result = service.parseUrl("https://github.com/owner/repo/tree/feature/my-feat");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: "feature/my-feat" });
  });

  it("throws on invalid URLs", () => {
    expect(() => service.parseUrl("https://gitlab.com/owner/repo")).toThrow();
    expect(() => service.parseUrl("not-a-url")).toThrow();
    expect(() => service.parseUrl("")).toThrow();
  });

  it("parses URLs with .git suffix as repo name", () => {
    const result = service.parseUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo.git", branch: undefined });
  });

  it("trims trailing slashes", () => {
    const result = service.parseUrl("https://github.com/owner/repo/");
    expect(result).toEqual({ owner: "owner", repo: "repo", branch: undefined });
  });

  it("handles URLs with hyphens and dots in owner/repo", () => {
    const result = service.parseUrl("https://github.com/my-org/my-repo");
    expect(result).toEqual({ owner: "my-org", repo: "my-repo", branch: undefined });
  });
});
