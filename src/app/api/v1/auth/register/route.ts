import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/supabase-server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
});

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_project_url" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your_supabase_anon_key"
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return apiError({
        code: "CONFIGURATION_ERROR",
        message: "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
        statusCode: 503,
      } as never);
    }

    const body = await request.json();
    const { email, password, displayName } = registerSchema.parse(body);

    let supabase;
    try {
      supabase = await getSupabaseServerClient();
    } catch {
      return apiError({
        code: "CONFIGURATION_ERROR",
        message: "Database connection failed. Check your Supabase configuration.",
        statusCode: 503,
      } as never);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? email.split("@")[0] },
      },
    });

    if (error) {
      return apiError({ code: "AUTH_ERROR", message: error.message, statusCode: 400 } as never);
    }

    if (!data.user) {
      return apiError({ code: "AUTH_ERROR", message: "Registration succeeded but user data is missing. Check your Supabase configuration.", statusCode: 500 } as never);
    }

    return apiSuccess({
      user: {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name ?? null,
        avatarUrl: null,
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError({ code: "VALIDATION_ERROR", message: error.errors[0]?.message ?? "Validation failed", statusCode: 422 } as never);
    }
    return apiError(error);
  }
}
