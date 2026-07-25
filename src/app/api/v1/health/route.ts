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
  let groqEvalTest = "not tested";
  if (checks.hasGroqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });
      groqTest = res.ok ? "OK" : `Failed (${res.status}): ${(await res.text()).slice(0, 100)}`;
    } catch (e) {
      groqTest = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
    // Test actual evaluation call
    try {
      const evalRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Analyze a project. Return JSON with test_key: { score: 85, summary: 'test' }" }],
          response_format: { type: "json_object" },
          max_tokens: 500,
        }),
      });
      const evalText = await evalRes.text();
      groqEvalTest = evalRes.ok ? `OK: ${evalText.slice(0, 200)}` : `Failed (${evalRes.status}): ${evalText.slice(0, 200)}`;
    } catch (e) {
      groqEvalTest = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ status: "ok", checks, groqTest, groqEvalTest });
}
