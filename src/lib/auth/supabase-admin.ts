import { createClient } from "@supabase/supabase-js";
import { getClientEnv, getServerEnv } from "@/lib/utils/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const clientEnv = getClientEnv();
  const serverEnv = getServerEnv();

  adminClient = createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
