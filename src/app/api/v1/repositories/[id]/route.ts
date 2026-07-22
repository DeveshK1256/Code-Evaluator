import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { repositoryService } from "@/services/repository.service";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { NotFoundError } from "@/lib/utils/errors";
import { manifestService } from "@/services/manifest.service";
import { rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    const repo = await repositoryService.getById(id, user.id);

    if (!repo) {
      return apiError(new NotFoundError("Repository"));
    }

    return apiSuccess(repo);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    const userId = user.id;

    const repo = await repositoryService.getById(id, userId);
    if (!repo) {
      return apiError(new NotFoundError("Repository"));
    }

    // Clean up workspace
    if (repo.workspacePath) {
      try {
        rmSync(repo.workspacePath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Clean up temp directory
    const tempPath = join(tmpdir(), "evaluations", id);
    try {
      rmSync(tempPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    await repositoryService.delete(id, userId);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    return apiError(error);
  }
}
