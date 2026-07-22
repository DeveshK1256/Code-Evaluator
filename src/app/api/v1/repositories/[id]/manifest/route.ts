import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { manifestService } from "@/services/manifest.service";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const manifest = await manifestService.getByRepositoryId(id);

    if (!manifest) {
      return apiError(new NotFoundError("Manifest"));
    }

    return apiSuccess(manifest);
  } catch (error) {
    return apiError(error);
  }
}
