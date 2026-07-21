import { ValidationError } from "@/lib/utils/errors";
import type { GitHubRepoMetadata, RepositoryFile } from "@/types/repository";
import { logger } from "@/lib/logger";

export class GitHubService {
  private readonly apiBase = "https://api.github.com";
  private readonly rawBase = "https://raw.githubusercontent.com";

  /**
   * Validate and parse a GitHub URL.
   * Supports: https://github.com/owner/repo, https://github.com/owner/repo/tree/branch
   */
  parseUrl(url: string): { owner: string; repo: string; branch?: string } {
    const trimmed = url.trim().replace(/\/+$/, "");

    // Match github.com/owner/repo[/tree/branch]
    const pattern = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\/tree\/([a-zA-Z0-9._\-\/]+))?$/;
    const match = trimmed.match(pattern);

    if (!match) {
      throw new ValidationError(
        "Invalid GitHub URL. Expected format: https://github.com/owner/repository"
      );
    }

    const owner = match[1]!;
    const repo = match[2]!;
    const branch = match[3];

    return { owner, repo, branch };
  }

  /**
   * Fetch repository metadata from GitHub API.
   * Verifies the repo is public and accessible.
   */
  async fetchMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata> {
    const response = await fetch(`${this.apiBase}/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 404) {
      throw new ValidationError(`Repository "${owner}/${repo}" not found. It may be private or deleted.`);
    }
    if (response.status === 403) {
      const rateLimit = response.headers.get("X-RateLimit-Remaining");
      if (rateLimit === "0") {
        throw new ValidationError("GitHub API rate limit exceeded. Please try again later.");
      }
      throw new ValidationError(`Repository "${owner}/${repo}" is not accessible.`);
    }
    if (!response.ok) {
      throw new ValidationError(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.private) {
      throw new ValidationError(
        `Repository "${owner}/${repo}" is private. Only public repositories are supported.`
      );
    }

    if (data.archived) {
      throw new ValidationError(
        `Repository "${owner}/${repo}" is archived. Archived repositories cannot be analyzed.`
      );
    }

    return {
      owner: data.owner.login,
      repo: data.name,
      description: data.description,
      defaultBranch: data.default_branch,
      visibility: data.visibility,
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      language: data.language,
      topics: data.topics ?? [],
      license: data.license?.spdx_id ?? null,
      size: data.size,
      pushedAt: data.pushed_at,
      hasIssues: data.has_issues,
      hasWiki: data.has_wiki,
      archived: data.archived,
      empty: data.size === 0,
    };
  }

  /**
   * Fetch the repository tree (file listing) via GitHub API.
   * Uses recursive tree to get all files without cloning.
   */
  async fetchFileTree(owner: string, repo: string, branch?: string): Promise<{
    files: Array<{ path: string; type: "blob" | "tree"; size: number }>;
    sha: string;
  }> {
    const resolvedBranch = branch ?? (await this.getDefaultBranch(owner, repo));
    const response = await fetch(
      `${this.apiBase}/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`,
      { headers: this.getHeaders(), signal: AbortSignal.timeout(30000) }
    );

    if (!response.ok) {
      throw new ValidationError("Failed to fetch repository file tree.");
    }

    const data = await response.json();
    const files = (data.tree as Array<{ path: string; type: string; size: number }>)
      .filter((item) => item.type === "blob")
      .map((item) => ({
        path: item.path,
        type: "blob" as const,
        size: item.size,
      }));

    return { files, sha: data.sha };
  }

  /**
   * Get the default branch name for a repo.
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const meta = await this.fetchMetadata(owner, repo);
    return meta.defaultBranch;
  }

  /**
   * Shallow clone a repository to a local workspace.
   */
  async cloneToWorkspace(owner: string, repo: string, workspacePath: string, branch?: string): Promise<void> {
    const { execSync } = await import("child_process");
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;

    try {
      execSync(
        `git clone --depth 1 --single-branch ${branch ? `--branch ${branch}` : ""} "${cloneUrl}" "${workspacePath}"`,
        { timeout: 120000, stdio: "pipe" }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Git clone failed", { owner, repo, error: message });

      if (message.includes("Repository not found") || message.includes("404")) {
        throw new ValidationError(`Repository "${owner}/${repo}" not found.`);
      }
      if (message.includes("timeout")) {
        throw new ValidationError("Clone timed out. The repository may be too large.");
      }
      throw new ValidationError(`Failed to clone repository: ${message.substring(0, 200)}`);
    }
  }

  /**
   * Fetch file content from raw GitHub.
   */
  async fetchFileContent(owner: string, repo: string, path: string, branch?: string): Promise<string | null> {
    const resolvedBranch = branch ?? (await this.getDefaultBranch(owner, repo));
    const url = `${this.rawBase}/${owner}/${repo}/${resolvedBranch}/${path}`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  /**
   * Check rate limit status.
   */
  async getRateLimit(): Promise<{ remaining: number; reset: number }> {
    const response = await fetch(`${this.apiBase}/rate_limit`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    return {
      remaining: data.resources?.core?.remaining ?? 0,
      reset: data.resources?.core?.reset ?? 0,
    };
  }

  /**
   * Validate that repository has content (not empty).
   */
  async validateNonEmpty(owner: string, repo: string, branch?: string): Promise<void> {
    const tree = await this.fetchFileTree(owner, repo, branch);
    if (tree.files.length === 0) {
      throw new ValidationError(`Repository "${owner}/${repo}" appears to be empty.`);
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "code-evaluator/1.0",
    };

    // Use optional GitHub token for higher rate limits
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }
}

export const gitHubService = new GitHubService();
