import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/supabase-server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = registerSchema.parse(body);
    const supabase = await getSupabaseServerClient();

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

    return apiSuccess({
      user: {
        id: data.user!.id,
        email: data.user!.email,
        displayName: data.user!.user_metadata?.display_name ?? null,
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
