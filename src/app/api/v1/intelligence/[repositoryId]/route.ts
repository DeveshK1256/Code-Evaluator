import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";

/**
 * GET /api/v1/intelligence/[repositoryId]
 * Returns the full intelligence model for a repository.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  try {
    const { repositoryId } = await params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("repository_intelligence" as never)
      .select("*")
      .eq("repository_id", repositoryId)
      .single();

    if (error || !data) {
      return apiError({ code: "NOT_FOUND", message: "Intelligence data not found. Run analysis first.", statusCode: 404 } as never);
    }

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
