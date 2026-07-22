import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { repositoryService } from "@/services/repository.service";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);
    const status = await repositoryService.getStatus(id, user.id);

    if (!status) {
      return apiError(new NotFoundError("Repository"));
    }

    return apiSuccess(status);
  } catch (error) {
    return apiError(error);
  }
}
