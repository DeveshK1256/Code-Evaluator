import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess } from "@/lib/api/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({
        success: false,
        error: { code: "CONFIGURATION_ERROR", message: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      }, { status: 503 });
    }

    // Use direct supabase-js client (not SSR) since API routes manage cookies manually via the response
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_ERROR", message: error.message },
      }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_ERROR", message: "No session returned. Check Supabase configuration." },
      }, { status: 401 });
    }

    // Create response with auth cookies
    const response = apiSuccess({
      user: {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name ?? null,
      },
    });

    // Set auth cookies on the response
    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: data.session.expires_in,
      path: "/",
    });
    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: data.session.expires_in,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.errors[0]?.message ?? "Validation failed" },
      }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    }, { status: 500 });
  }
}
