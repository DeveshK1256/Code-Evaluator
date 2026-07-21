import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { repositoryService } from "@/services/repository.service";
import { manifestService } from "@/services/manifest.service";
import { rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "user-placeholder";
    const repo = await repositoryService.getById(id, userId);

    if (!repo) {
      return apiError({ code: "NOT_FOUND", message: "Repository not found", statusCode: 404 } as never);
    }

    return apiSuccess(repo);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "user-placeholder";

    const repo = await repositoryService.getById(id, userId);
    if (!repo) {
      return apiError({ code: "NOT_FOUND", message: "Repository not found", statusCode: 404 } as never);
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
