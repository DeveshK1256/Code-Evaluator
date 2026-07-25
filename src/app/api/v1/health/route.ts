import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    hasGroqKey: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.slice(0, 8) + "..." : "not set",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  };

  let groqTest = "not tested";
  if (checks.hasGroqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });
      groqTest = res.ok ? "OK" : `Failed (${res.status}): ${(await res.text()).slice(0, 100)}`;
    } catch (e) {
      groqTest = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ status: "ok", checks, groqTest });
}
