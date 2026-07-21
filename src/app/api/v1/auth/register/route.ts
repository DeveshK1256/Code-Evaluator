import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(_cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) { /* cookies set on response below */ },
      },
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

    // Supabase returns a user even for existing emails (if confirmation email resend succeeds)
    // Detect this: if identity data exists, it means this is a pre-existing user
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

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email!,
          displayName: data.user.user_metadata?.display_name ?? null,
        },
      },
    }, { status: 201 });

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
