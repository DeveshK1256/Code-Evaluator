import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ValidationError } from "@/lib/utils/errors";
import { repositoryService } from "@/services/repository.service";
import { gitHubService } from "@/services/github.service";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  githubUrl: z.string().min(1, "GitHub URL is required"),
  name: z.string().optional(),
});

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return apiError({
        code: "CONFIGURATION_ERROR",
        message: "Supabase is not configured. Repository import requires database storage. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
        statusCode: 503,
      } as never);
    }

    const body = await request.json();
    const { githubUrl, name } = schema.parse(body);

    // Simulate auth (will use real session in production)
    const userId = "user-placeholder";

    // 1. Validate and parse URL
    const { owner, repo, branch } = gitHubService.parseUrl(githubUrl);

    // 2. Check for duplicate
    const existing = await repositoryService.listByUser(userId);
    const duplicate = existing.repositories.find(
      (r) => r.githubOwner === owner && r.githubRepo === repo && r.source === "github"
    );
    if (duplicate && duplicate.status !== "failed") {
      throw new ValidationError(
        `Repository "${owner}/${repo}" has already been imported.`
      );
    }

    // 3. Fetch metadata to verify repo is public
    const metadata = await gitHubService.fetchMetadata(owner, repo);

    // 4. Create repository record
    const repository = await repositoryService.create({
      userId,
      name: name ?? repo,
      source: "github",
      githubUrl,
      githubOwner: owner,
      githubRepo: repo,
    });

    // 5. Update with metadata from GitHub
    await repositoryService.updateMetadata(repository.id, {
      description: metadata.description ?? undefined,
      defaultBranch: metadata.defaultBranch,
      visibility: metadata.visibility,
      stars: metadata.stars,
      forks: metadata.forks,
      openIssues: metadata.openIssues,
      primaryLanguage: metadata.language ?? undefined,
      topics: metadata.topics,
      license: metadata.license ?? undefined,
      hasReadme: metadata.hasIssues,
      hasLicense: !!metadata.license,
      lastUpdated: metadata.pushedAt,
    });

    // 6. Queue background ingestion
    await inngest.send({
      name: "repository/github.ingest",
      data: {
        repositoryId: repository.id,
        owner,
        repo,
        branch: branch ?? metadata.defaultBranch,
        userId,
      },
    });

    logger.info("GitHub repository queued for ingestion", {
      repositoryId: repository.id,
      owner,
      repo,
    });

    return apiSuccess({
      id: repository.id,
      name: repository.name,
      owner,
      repo,
      status: repository.status,
      metadata: {
        description: metadata.description,
        stars: metadata.stars,
        forks: metadata.forks,
        language: metadata.language,
        defaultBranch: metadata.defaultBranch,
        topics: metadata.topics,
      },
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
