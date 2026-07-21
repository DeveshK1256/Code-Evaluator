import { NextResponse } from "next/server";
import { APP_VERSION } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  const health = {
    status: "healthy",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: { status: "healthy", latency: `${Date.now() - startTime}ms` },
      auth: { status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "not_configured" },
      database: { status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "not_configured" },
      gemini: { status: process.env.GEMINI_API_KEY ? "configured" : "not_configured" },
      inngest: { status: process.env.INNGEST_EVENT_KEY ? "configured" : "not_configured" },
    },
    memory: {
      usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
