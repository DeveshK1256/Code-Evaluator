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
import { fileDiscoveryService } from "@/services/file-discovery.service";
import { techDetectionService } from "@/services/tech-detection.service";
import { manifestService } from "@/services/manifest.service";
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

    // ─── Synchronous processing (replaces Inngest to avoid event size limit) ───

    // Scan files
    await uploadService.updateProgress(upload.id, 60, "scanning");
    await repositoryService.updateStatus(repository.id, "scanning", {
      progress: 60,
      statusMessage: "Scanning extracted files...",
    });

    const scanResult = await fileDiscoveryService.scan(workspacePath, repository.id);
    const fingerprint = fileDiscoveryService.generateFingerprint(scanResult.directoryTree);

    await repositoryService.updateMetadata(repository.id, {
      sizeBytes: scanResult.summary.totalSizeBytes,
      fileCount: scanResult.summary.totalFiles,
      hasReadme: scanResult.files.some((f) => f.path.toLowerCase().startsWith("readme")),
      hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
      hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
    });

    // Detect technologies
    await uploadService.updateProgress(upload.id, 80, "detecting");
    await repositoryService.updateStatus(repository.id, "detecting", {
      progress: 80,
      statusMessage: "Detecting technologies...",
    });

    const techResult = await techDetectionService.detect(
      scanResult.files.map((f) => f.path),
      async (path: string) => fileDiscoveryService.readFileContent(workspacePath, path)
    );

    // Generate manifest
    const manifest = await manifestService.generate({
      repositoryId: repository.id,
      name: `Upload ${new Date().toLocaleDateString()}`,
      source: "zip",
      totalFiles: scanResult.summary.totalFiles,
      totalSizeBytes: scanResult.summary.totalSizeBytes,
      hasReadme: scanResult.summary.configFiles > 0,
      hasLicense: scanResult.files.some((f) => f.path.toLowerCase().startsWith("license")),
      hasCiCd: scanResult.files.some((f) => f.path.startsWith(".github/workflows/")),
      files: scanResult.files,
      technologies: techResult,
      directoryTree: scanResult.directoryTree,
    });

    // Mark ready
    await uploadService.updateProgress(upload.id, 100, "completed");
    await repositoryService.updateStatus(repository.id, "ready_for_analysis", {
      progress: 100,
      statusMessage: "Upload ready for analysis",
      contentFingerprint: fingerprint,
      manifestId: manifest.id,
    });

    logger.info("ZIP upload processed successfully", {
      repositoryId: repository.id,
      fileName: file.name,
      fileSize: file.size,
      fileCount: scanResult.summary.totalFiles,
      technologies: techResult.items.length,
    });

    return apiSuccess({
      id: repository.id,
      uploadId: upload.id,
      name: repository.name,
      status: "ready_for_analysis",
      fileCount: scanResult.summary.totalFiles,
      sizeBytes: scanResult.summary.totalSizeBytes,
      technologies: techResult.items.map((t) => t.name),
      manifestId: manifest.id,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
