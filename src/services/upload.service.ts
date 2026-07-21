import { getSupabaseAdminClient } from "@/lib/auth/supabase-admin";
import type { Upload } from "@/types/repository";
import { logger } from "@/lib/logger";

export class UploadService {
  /**
   * Create an upload record.
   */
  async create(data: {
    userId: string;
    repositoryId: string;
    source: Upload["source"];
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
  }): Promise<Upload> {
    const supabase = getSupabaseAdminClient();
    const { data: upload, error } = await supabase
      .from("uploads" as never)
      .insert({
        user_id: data.userId,
        repository_id: data.repositoryId,
        source: data.source,
        status: "uploading",
        progress: 0,
        file_name: data.fileName,
        file_size_bytes: data.fileSizeBytes,
        mime_type: data.mimeType,
      } as never)
      .select()
      .single();

    if (error) throw error;
    return this.mapUpload(upload);
  }

  /**
   * Update upload progress.
   */
  async updateProgress(id: string, progress: number, status?: Upload["status"]): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const updates: Record<string, unknown> = { progress };

    if (status) {
      updates.status = status;
      if (status === "completed" || status === "failed") {
        updates.completed_at = new Date().toISOString();
      }
    }

    const { error } = await supabase.from("uploads" as never).update(updates as never).eq("id", id);
    if (error) throw error;
  }

  /**
   * Mark upload as failed.
   */
  async markFailed(id: string, errorMessage: string): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("uploads" as never).update({
      status: "failed",
      error_message: errorMessage,
      progress: 0,
      completed_at: new Date().toISOString(),
    } as never).eq("id", id);

    if (error) throw error;
    logger.error("Upload failed", { uploadId: id, error: errorMessage });
  }

  /**
   * Get upload by ID.
   */
  async getById(id: string): Promise<Upload | null> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase.from("uploads" as never).select("*").eq("id", id).single();
    return data ? this.mapUpload(data) : null;
  }

  /**
   * List uploads for a repository.
   */
  async listByRepository(repositoryId: string): Promise<Upload[]> {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("uploads" as never)
      .select("*")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false });

    return (data ?? []).map(this.mapUpload);
  }

  private mapUpload(data: Record<string, unknown>): Upload {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      repositoryId: data.repository_id as string,
      source: data.source as Upload["source"],
      status: data.status as Upload["status"],
      fileName: data.file_name as string | undefined,
      fileSizeBytes: data.file_size_bytes as number | undefined,
      mimeType: data.mime_type as string | undefined,
      progress: (data.progress as number) ?? 0,
      errorMessage: data.error_message as string | undefined,
      createdAt: data.created_at as string,
      completedAt: data.completed_at as string | undefined,
    };
  }
}

export const uploadService = new UploadService();
