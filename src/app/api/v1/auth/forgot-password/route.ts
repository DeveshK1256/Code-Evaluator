import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/supabase-server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/utils/errors";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      return apiError(new AppError("AUTH_ERROR", error.message, 400));
    }

    // Always return success to prevent email enumeration
    return apiSuccess({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(new AppError("VALIDATION_ERROR", error.errors[0]?.message ?? "Validation failed", 422));
    }
    return apiError(error);
  }
}
