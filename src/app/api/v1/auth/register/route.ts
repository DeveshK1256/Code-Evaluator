import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess } from "@/lib/api/response";
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json({
        success: false,
        error: { code: "CONFIGURATION_ERROR", message: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      }, { status: 503 });
    }

    // Use direct supabase-js client (not SSR) since API routes manage cookies manually
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? email.split("@")[0] },
      },
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_ERROR", message: error.message },
      }, { status: 400 });
    }

    // Supabase returns identities=[] when the email is already registered
    if (data.user?.identities?.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: "USER_EXISTS", message: "An account with this email already exists. Please sign in instead." },
      }, { status: 409 });
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: { code: "AUTH_ERROR", message: "Unable to create user. Check your Supabase configuration." },
      }, { status: 500 });
    }

    const response = apiSuccess({
      user: {
        id: data.user.id,
        email: data.user.email!,
        displayName: data.user.user_metadata?.display_name ?? null,
      },
    }, 201);

    // Set session cookies if session was created (auto-confirm enabled)
    if (data.session) {
      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true, secure: true, sameSite: "lax",
        maxAge: data.session.expires_in, path: "/",
      });
      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true, secure: true, sameSite: "lax",
        maxAge: data.session.expires_in, path: "/",
      });
    }

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
