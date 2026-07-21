/**
 * Database client configurations.
 * All clients are lazy-loaded to avoid initialization at import time.
 */

export { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
export { getSupabaseServerClient } from "@/lib/auth/supabase-server";
export { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";

/**
 * Placeholder table schema types.
 * These will be replaced with auto-generated Supabase types when the database is configured.
 */

export type Tables = {
  users: UserRow;
  repositories: RepositoryRow;
  analysis_jobs: AnalysisJobRow;
  evaluation_reports: EvaluationReportRow;
  settings: SettingRow;
};

export interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepositoryRow {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  type: "github" | "zip" | "folder" | "readme";
  status: "pending" | "cloning" | "ready" | "error";
  file_count: number | null;
  size_bytes: number | null;
  content_fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJobRow {
  id: string;
  repository_id: string;
  user_id: string;
  status: "pending" | "analyzing" | "completed" | "failed";
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface EvaluationReportRow {
  id: string;
  analysis_job_id: string;
  user_id: string;
  overall_score: number | null;
  overall_grade: string | null;
  summary: string | null;
  module_results: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  exported_formats: string[];
  created_at: string;
}

export interface SettingRow {
  id: string;
  user_id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
