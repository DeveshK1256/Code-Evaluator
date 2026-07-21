import { z } from "zod";

/**
 * Environment variable validation schema.
 * Ensures all required env vars are present and correctly typed.
 */

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_APP_ID: z.string().default("code-evaluator"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Code Evaluator"),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid server environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }
  _serverEnv = result.data;
  return _serverEnv;
}

export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });
  if (!result.success) {
    console.error("❌ Invalid client environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }
  _clientEnv = result.data;
  return _clientEnv;
}
