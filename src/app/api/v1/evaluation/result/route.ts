import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const repositoryId = url.searchParams.get("repositoryId");
    const sessionId = url.searchParams.get("sessionId");

    if (!repositoryId && !sessionId) {
      return apiError({ code: "VALIDATION_ERROR", message: "Provide repositoryId or sessionId", statusCode: 422 } as never);
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
