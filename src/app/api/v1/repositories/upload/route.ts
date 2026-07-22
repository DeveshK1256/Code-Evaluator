import { NextRequest } from "next/server";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ValidationError } from "@/lib/utils/errors";
import { repositoryService } from "@/services/repository.service";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { uploadService } from "@/services/upload.service";
import { zipService } from "@/services/zip.service";
import { inngest } from "@/inngest/client";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const userId = user.id;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ValidationError("No file provided. Please upload a ZIP file.");
    }

    // Validate file type
    const isZip =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.endsWith(".zip");

    if (!isZip) {
      throw new ValidationError("Only .zip files are supported for upload.");
    }

    // Validate file size
    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
      throw new ValidationError(
        `File exceeds maximum size of ${maxSize / 1024 / 1024} MB.`
      );
    }

    // Create repository record
    const repository = await repositoryService.create({
      userId,
      name: file.name.replace(/\.zip$/i, ""),
      source: "zip",
    });

    // Create upload record
    const upload = await uploadService.create({
      userId,
      repositoryId: repository.id,
      source: "zip",
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    });

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create workspace
    const workspacePath = join(tmpdir(), "evaluations", repository.id, "source");
    if (!existsSync(workspacePath)) {
      mkdirSync(workspacePath, { recursive: true });
    }

    // Save uploaded file temporarily
    const zipPath = join(tmpdir(), "evaluations", repository.id, "upload.zip");
    writeFileSync(zipPath, buffer);

    // Validate ZIP
    await uploadService.updateProgress(upload.id, 20, "validating");
    const validation = await zipService.validate(buffer, file.name);
    if (!validation.valid) {
      await uploadService.markFailed(upload.id, validation.message ?? "Invalid ZIP");
      await repositoryService.updateStatus(repository.id, "failed", {
        statusMessage: validation.message ?? "Invalid ZIP file",
      });
      throw new ValidationError(validation.message ?? "Invalid ZIP file.");
    }

    // Extract
    await uploadService.updateProgress(upload.id, 50, "processing");
    const extractResult = await zipService.extract(buffer, workspacePath);

    await repositoryService.updateMetadata(repository.id, {
      sizeBytes: extractResult.totalSizeBytes,
      fileCount: extractResult.fileCount,
    });

    // Mark upload complete
    await uploadService.updateProgress(upload.id, 100, "completed");

    // Queue background ingestion for tech detection + manifest
    await inngest.send({
      name: "repository/zip.ingest",
      data: {
        repositoryId: repository.id,
        buffer: Array.from(buffer),
        userId,
      },
    });

    logger.info("ZIP upload queued for processing", {
      repositoryId: repository.id,
      fileName: file.name,
      fileSize: file.size,
    });

    return apiSuccess({
      id: repository.id,
      uploadId: upload.id,
      name: repository.name,
      status: repository.status,
      fileCount: extractResult.fileCount,
      sizeBytes: extractResult.totalSizeBytes,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
