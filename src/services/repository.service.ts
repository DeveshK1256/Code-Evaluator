import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import type { Repository, RepositoryStatus, RepositoryStatusResponse } from "@/types/repository";

export class RepositoryService {
  /**
   * Create a new repository record.
   */
  async create(data: {
    userId: string;
    name: string;
    source: Repository["source"];
    githubUrl?: string;
    githubOwner?: string;
    githubRepo?: string;
  }): Promise<Repository> {
    const supabase = getSupabaseAdminClient();
    const { data: repo, error } = await supabase
      .from("repositories" as never)
      .insert({
        user_id: data.userId,
        name: data.name,
        source: data.source,
        status: "pending",
        progress: 0,
        github_url: data.githubUrl,
        github_owner: data.githubOwner,
        github_repo: data.githubRepo,
        visibility: "unknown",
        has_readme: false,
        has_license: false,
        has_ci_cd: false,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return this.mapRepository(repo);
  }

  /**
   * Get a repository by ID.
   */
  async getById(id: string, userId: string): Promise<Repository | null> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("repositories" as never)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    return data ? this.mapRepository(data) : null;
  }

  /**
   * List repositories for a user, most recent first.
   */
  async listByUser(
    userId: string,
    options?: { page?: number; pageSize?: number; status?: RepositoryStatus; source?: string }
  ): Promise<{ repositories: Repository[]; total: number }> {
    const supabase = getSupabaseAdminClient();
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("repositories" as never)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.source) {
      query = query.eq("source", options.source);
    }

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    return {
      repositories: (data ?? []).map(this.mapRepository),
      total: count ?? 0,
    };
  }

  /**
   * Update repository status.
   */
  async updateStatus(
    id: string,
    status: RepositoryStatus,
    extra?: Partial<{
      progress: number;
      statusMessage: string;
      workspacePath: string;
      contentFingerprint: string;
      manifestId: string;
      completedAt: string;
    }>
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

    if (extra?.progress !== undefined) updates.progress = extra.progress;
    if (extra?.statusMessage) updates.status_message = extra.statusMessage;
    if (extra?.workspacePath) updates.workspace_path = extra.workspacePath;
    if (extra?.contentFingerprint) updates.content_fingerprint = extra.contentFingerprint;
    if (extra?.manifestId) updates.manifest_id = extra.manifestId;
    if (extra?.completedAt) updates.completed_at = extra.completedAt;

    if (status === "failed" || status === "ready_for_analysis" || status === "evaluation_complete") {
      updates.completed_at = extra?.completedAt ?? new Date().toISOString();
    }

    const { error } = await supabase.from("repositories" as never).update(updates as never).eq("id", id);
    if (error) throw error;
  }

  /**
   * Update repository metadata from GitHub or scan.
   */
  async updateMetadata(
    id: string,
    metadata: Partial<{
      name: string;
      description: string;
      defaultBranch: string;
      visibility: string;
      stars: number;
      forks: number;
      openIssues: number;
      sizeBytes: number;
      fileCount: number;
      primaryLanguage: string;
      topics: string[];
      license: string;
      lastUpdated: string;
      commitCount: number;
      contributorCount: number;
      hasReadme: boolean;
      hasLicense: boolean;
      hasCiCd: boolean;
    }>
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const dbData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (metadata.name !== undefined) dbData.name = metadata.name;
    if (metadata.description !== undefined) dbData.description = metadata.description;
    if (metadata.defaultBranch !== undefined) dbData.default_branch = metadata.defaultBranch;
    if (metadata.visibility !== undefined) dbData.visibility = metadata.visibility;
    if (metadata.stars !== undefined) dbData.stars = metadata.stars;
    if (metadata.forks !== undefined) dbData.forks = metadata.forks;
    if (metadata.openIssues !== undefined) dbData.open_issues = metadata.openIssues;
    if (metadata.sizeBytes !== undefined) dbData.size_bytes = metadata.sizeBytes;
    if (metadata.fileCount !== undefined) dbData.file_count = metadata.fileCount;
    if (metadata.primaryLanguage !== undefined) dbData.primary_language = metadata.primaryLanguage;
    if (metadata.topics !== undefined) dbData.topics = metadata.topics;
    if (metadata.license !== undefined) dbData.license = metadata.license;
    if (metadata.lastUpdated !== undefined) dbData.last_updated = metadata.lastUpdated;
    if (metadata.commitCount !== undefined) dbData.commit_count = metadata.commitCount;
    if (metadata.contributorCount !== undefined) dbData.contributor_count = metadata.contributorCount;
    if (metadata.hasReadme !== undefined) dbData.has_readme = metadata.hasReadme;
    if (metadata.hasLicense !== undefined) dbData.has_license = metadata.hasLicense;
    if (metadata.hasCiCd !== undefined) dbData.has_ci_cd = metadata.hasCiCd;

    const { error } = await supabase.from("repositories" as never).update(dbData as never).eq("id", id);
    if (error) throw error;
  }

  /**
   * Delete a repository and all associated data.
   */
  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("repositories" as never)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }

  /**
   * Get repository status for polling.
   */
  async getStatus(id: string, userId: string): Promise<RepositoryStatusResponse | null> {
    const repo = await this.getById(id, userId);
    if (!repo) return null;

    return {
      id: repo.id,
      status: repo.status,
      progress: repo.progress,
      statusMessage: repo.statusMessage,
      source: repo.source,
      createdAt: repo.createdAt,
      completedAt: repo.completedAt,
    };
  }

  /**
   * Count repositories by status for a user.
   */
  async countByStatus(userId: string): Promise<Record<string, number>> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("repositories" as never)
      .select("status")
      .eq("user_id", userId) as unknown as { data: { status: string }[] | null; error: unknown };

    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Validate that a status transition is allowed.
   */
  isValidTransition(from: RepositoryStatus, to: RepositoryStatus): boolean {
    const { REPOSITORY_STATUS_FLOW } = require("@/types/repository");
    return (REPOSITORY_STATUS_FLOW[from] ?? []).includes(to);
  }

  // ─── Private ─────────────────────────────────────────────────

  private mapRepository(data: Record<string, unknown>): Repository {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      name: data.name as string,
      source: data.source as Repository["source"],
      status: data.status as RepositoryStatus,
      statusMessage: data.status_message as string | undefined,
      progress: (data.progress as number) ?? 0,
      githubUrl: data.github_url as string | undefined,
      githubOwner: data.github_owner as string | undefined,
      githubRepo: data.github_repo as string | undefined,
      defaultBranch: data.default_branch as string | undefined,
      visibility: (data.visibility as "public" | "private" | "unknown") ?? "unknown",
      description: data.description as string | undefined,
      license: data.license as string | undefined,
      stars: (data.stars as number) ?? 0,
      forks: (data.forks as number) ?? 0,
      openIssues: (data.open_issues as number) ?? 0,
      sizeBytes: (data.size_bytes as number) ?? 0,
      fileCount: (data.file_count as number) ?? 0,
      primaryLanguage: data.primary_language as string | undefined,
      topics: (data.topics as string[]) ?? [],
      lastUpdated: data.last_updated as string | undefined,
      commitCount: (data.commit_count as number) ?? 0,
      contributorCount: (data.contributor_count as number) ?? 0,
      hasReadme: (data.has_readme as boolean) ?? false,
      hasLicense: (data.has_license as boolean) ?? false,
      hasCiCd: (data.has_ci_cd as boolean) ?? false,
      workspacePath: data.workspace_path as string | undefined,
      contentFingerprint: data.content_fingerprint as string | undefined,
      manifestId: data.manifest_id as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      completedAt: data.completed_at as string | undefined,
    };
  }
}

export const repositoryService = new RepositoryService();
