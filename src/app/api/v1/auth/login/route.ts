import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/supabase-server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return apiError({ code: "AUTH_ERROR", message: error.message, statusCode: 401 } as never);
    }

    return apiSuccess({
      user: {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name ?? null,
        avatarUrl: data.user.user_metadata?.avatar_url ?? null,
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError({ code: "VALIDATION_ERROR", message: error.errors[0]?.message ?? "Validation failed", statusCode: 422 } as never);
    }
    return apiError(error);
  }
}
