import { getSupabaseServerClient } from "./supabase-server";

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    displayName: data.user.user_metadata?.display_name ?? data.user.email?.split("@")[0] ?? "Unknown",
    avatarUrl: data.user.user_metadata?.avatar_url ?? null,
    createdAt: data.user.created_at,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
