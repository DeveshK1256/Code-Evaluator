import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { repositoryService } from "@/services/repository.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "user-placeholder";
    const status = await repositoryService.getStatus(id, userId);

    if (!status) {
      return apiError({ code: "NOT_FOUND", message: "Repository not found", statusCode: 404 } as never);
    }

    return apiSuccess(status);
  } catch (error) {
    return apiError(error);
  }
}
