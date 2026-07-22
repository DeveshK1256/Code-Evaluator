import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const repositoryId = url.searchParams.get("repositoryId");
    const sessionId = url.searchParams.get("sessionId");

    if (!repositoryId && !sessionId) {
      return apiError(new AppError("VALIDATION_ERROR", "Provide repositoryId or sessionId", 422));
    }

    // In production, fetch from database
    return apiSuccess({
      message: "Evaluation results will be fetched from the database.",
      repositoryId,
      sessionId,
      _note: "Database integration for storing evaluation results is configured via the evaluation_schema migration.",
    });
  } catch (error) {
    return apiError(error);
  }
}
