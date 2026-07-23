import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError, ValidationError } from "@/lib/utils/errors";
import { repositoryService } from "@/services/repository.service";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { gitHubService } from "@/services/github.service";
import { fileDiscoveryService } from "@/services/file-discovery.service";
import { techDetectionService } from "@/services/tech-detection.service";
import { manifestService } from "@/services/manifest.service";
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
      return apiError(
        new AppError("CONFIGURATION_ERROR", "Supabase is not configured. Repository import requires database storage. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.", 503)
      );
    }

    const body = await request.json();
    const { githubUrl, name } = schema.parse(body);

    // Authenticate from request cookies
    const user = await getAuthenticatedUser(request);
    const userId = user.id;

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

    const resolvedBranch = branch ?? metadata.defaultBranch;

    // 5. Clone (download ZIP + extract)
    await repositoryService.updateStatus(repository.id, "extracting", {
      progress: 10,
      statusMessage: "Downloading repository...",
    });

    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const workspacePath = join(tmpdir(), "evaluations", repository.id, "source");

    await gitHubService.cloneToWorkspace(owner, repo, workspacePath, resolvedBranch);

    await repositoryService.updateStatus(repository.id, "extracting", {
      progress: 30,
      statusMessage: "Repository downloaded. Scanning files...",
    });

    // 6. Scan files
    await repositoryService.updateStatus(repository.id, "scanning", {
      progress: 40,
      statusMessage: "Scanning repository structure...",
    });

    const scanResult = await fileDiscoveryService.scan(workspacePath, repository.id);
    const fingerprint = fileDiscoveryService.generateFingerprint(scanResult.directoryTree);

    await repositoryService.updateMetadata(repository.id, {
      sizeBytes: scanResult.summary.totalSizeBytes,
      fileCount: scanResult.summary.totalFiles,
      hasReadme: scanResult.files.some((f) => f.path.toLowerCase().startsWith("readme")),
      hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
      hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
      primaryLanguage: metadata.language ?? undefined,
      description: metadata.description ?? undefined,
      defaultBranch: resolvedBranch,
      visibility: metadata.visibility,
      stars: metadata.stars,
      forks: metadata.forks,
      openIssues: metadata.openIssues,
      topics: metadata.topics,
      license: metadata.license ?? undefined,
      lastUpdated: metadata.pushedAt ?? undefined,
    });

    // 7. Detect technologies
    await repositoryService.updateStatus(repository.id, "detecting", {
      progress: 60,
      statusMessage: "Detecting technologies...",
    });

    const techResult = await techDetectionService.detect(
      scanResult.files.map((f) => f.path),
      async (path: string) => fileDiscoveryService.readFileContent(workspacePath, path)
    );

    // 8. Generate manifest
    await repositoryService.updateStatus(repository.id, "detecting", {
      progress: 80,
      statusMessage: "Generating repository manifest...",
    });

    const manifest = await manifestService.generate({
      repositoryId: repository.id,
      name: repo,
      source: "github",
      description: metadata.description ?? undefined,
      defaultBranch: resolvedBranch,
      license: metadata.license ?? undefined,
      stars: metadata.stars ?? undefined,
      forks: metadata.forks ?? undefined,
      totalFiles: scanResult.summary.totalFiles,
      totalSizeBytes: scanResult.summary.totalSizeBytes,
      primaryLanguage: metadata.language ?? undefined,
      hasReadme: scanResult.summary.configFiles > 0,
      hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
      hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
      files: scanResult.files,
      technologies: techResult,
      directoryTree: scanResult.directoryTree,
    });

    // 9. Mark ready
    await repositoryService.updateStatus(repository.id, "ready_for_analysis", {
      progress: 100,
      statusMessage: "Repository ready for analysis",
      contentFingerprint: fingerprint,
      manifestId: manifest.id,
    });

    logger.info("GitHub repository imported and processed", {
      repositoryId: repository.id,
      owner,
      repo,
      fileCount: scanResult.summary.totalFiles,
      technologies: techResult.items.map((t) => t.name),
    });

    return apiSuccess({
      id: repository.id,
      name: repository.name,
      owner,
      repo,
      status: "ready_for_analysis",
      metadata: {
        description: metadata.description,
        stars: metadata.stars,
        forks: metadata.forks,
        language: metadata.language,
        defaultBranch: metadata.defaultBranch,
        topics: metadata.topics,
      },
      fileCount: scanResult.summary.totalFiles,
      technologies: techResult.items.map((t) => t.name),
      manifestId: manifest.id,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
