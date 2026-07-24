import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const supabase = getSupabaseAdminClient();

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    const repositoryId = url.searchParams.get("repositoryId");

    if (sessionId) {
      // Fetch single session with all results
      const { data: session, error: sessionError } = await supabase
        .from("evaluation_sessions" as never)
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (sessionError || !session) {
        return apiError({ code: "NOT_FOUND", message: "Evaluation session not found", statusCode: 404 } as never);
      }

      const { data: moduleResults } = await supabase
        .from("module_results" as never)
        .select("*")
        .eq("session_id", sessionId);

      const { data: recommendations } = await supabase
        .from("recommendations" as never)
        .select("*")
        .eq("session_id", sessionId)
        .order("priority", { ascending: false })
        .order("severity" as never, { ascending: false });

      return apiSuccess({
        session: (session as Record<string, unknown>),
        modules: (moduleResults ?? []) as Record<string, unknown>[],
        recommendations: (recommendations ?? []) as Record<string, unknown>[],
      });
    }

    // Fetch all sessions for user, optionally filtered by repository
    let query = supabase
      .from("evaluation_sessions" as never)
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false } as never);

    if (repositoryId) {
      query = query.eq("repository_id", repositoryId);
    }

    const { data: sessions, error } = await query;
    if (error) throw error;

    return apiSuccess({
      sessions: (sessions ?? []) as Record<string, unknown>[],
      total: (sessions ?? []).length,
    });
  } catch (error) {
    return apiError(error);
  }
}
