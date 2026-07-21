import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { repositoryService } from "@/services/repository.service";
import type { RepositoryStatus } from "@/types/repository";

export async function GET(request: NextRequest) {
  try {
    const userId = "user-placeholder";
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20");
    const status = url.searchParams.get("status") as RepositoryStatus | null;
    const source = url.searchParams.get("source") ?? undefined;

    const result = await repositoryService.listByUser(userId, {
      page,
      pageSize,
      status: status ?? undefined,
      source,
    });

    return apiSuccess({
      repositories: result.repositories,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    return apiError(error);
  }
}
