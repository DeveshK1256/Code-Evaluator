/**
 * Supabase API client for server-side API routes.
 * Uses the direct supabase-js client (not SSR) since API routes
 * don't need cookie-based session management.
 */
import { createClient } from "@supabase/supabase-js";

let apiClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseApiClient(): ReturnType<typeof createClient> {
  if (apiClient) return apiClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }

  apiClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return apiClient;
}
