import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  try {
    const { repositoryId } = await params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("intelligence_sessions" as never)
      .select("*")
      .eq("repository_id", repositoryId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return apiSuccess({
        repositoryId,
        status: "pending",
        progress: 0,
        message: "No intelligence analysis has been started yet.",
      });
    }

    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
