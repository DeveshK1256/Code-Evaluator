/**
 * Auth helper for API routes.
 * Validates the session from request cookies and returns the authenticated user.
 */
import { createClient } from "@supabase/supabase-js";
import { UnauthorizedError } from "@/lib/utils/errors";
import type { NextRequest } from "next/server";

let _url: string | undefined;
let _key: string | undefined;

function getSupabaseCredentials() {
  if (!_url) _url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!_key) _key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url: _url, key: _key };
}

/**
 * Extract the authenticated user from a Next.js API route request.
 * Reads the sb-access-token cookie and validates it against Supabase.
 * Throws UnauthorizedError if the session is missing, invalid, or expired.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    throw new UnauthorizedError("Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    throw new UnauthorizedError("Authentication required");
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    throw new UnauthorizedError("Invalid or expired session. Please sign in again.");
  }

  return user;
}
