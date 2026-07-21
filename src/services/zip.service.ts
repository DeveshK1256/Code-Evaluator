import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/logger";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import { join, resolve, normalize, relative } from "path";

const MAX_ZIP_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILES = 50000;
const MAX_DECOMPRESS_RATIO = 100; // Reject if decompressed > 100x compressed

export class ZipService {
  /**
   * Validate a ZIP file before extraction.
   */
  async validate(buffer: Buffer, fileName: string): Promise<{ valid: boolean; message?: string }> {
    // Check file extension
    if (!fileName.toLowerCase().endsWith(".zip")) {
      return { valid: false, message: "Only .zip files are supported." };
    }

    // Check file size
    if (buffer.length > MAX_ZIP_SIZE_BYTES) {
      return {
        valid: false,
        message: `File exceeds maximum size of ${MAX_ZIP_SIZE_BYTES / 1024 / 1024} MB.`,
      };
    }

    // Check ZIP header magic bytes
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return { valid: false, message: "File is not a valid ZIP archive." };
    }

    // Check for compression bombs (very small zip with very large content)
    try {
      const { default: AdmZip } = await import("adm-zip");
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      if (entries.length === 0) {
        return { valid: false, message: "ZIP archive is empty." };
      }

      if (entries.length > MAX_FILES) {
        return {
          valid: false,
          message: `ZIP contains too many files (${entries.length}). Maximum is ${MAX_FILES}.`,
        };
      }

      // Check decompression ratio
      const totalCompressed = buffer.length;
      let totalUncompressed = 0;
      for (const entry of entries) {
        totalUncompressed += entry.header.size;
      }

      if (totalUncompressed > totalCompressed * MAX_DECOMPRESS_RATIO) {
        return {
          valid: false,
          message: "Archive appears to be a compression bomb. Extraction denied.",
        };
      }
    } catch (error) {
      logger.error("ZIP validation failed", { fileName, error: String(error) });
      return { valid: false, message: "Failed to validate ZIP archive. It may be corrupted." };
    }

    return { valid: true };
  }

  /**
   * Extract a ZIP buffer to a workspace directory with Zip Slip protection.
   */
  async extract(buffer: Buffer, workspacePath: string): Promise<{
    fileCount: number;
    totalSizeBytes: number;
  }> {
    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let fileCount = 0;
    let totalSizeBytes = 0;

    // Create workspace directory
    if (!existsSync(workspacePath)) {
      mkdirSync(workspacePath, { recursive: true });
    }

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      // Zip Slip Prevention: reject paths with ".." traversal
      const entryName = entry.entryName;
      if (entryName.includes("..") || entryName.startsWith("/")) {
        logger.warn("Zip Slip attempt blocked", { entryName });
        throw new ValidationError(
          `Security: Path traversal detected in archive entry: ${entryName}`
        );
      }

      // Ensure the entry path is within the workspace
      const fullPath = join(workspacePath, entryName);
      const normalizedPath = normalize(fullPath);
      const resolvedBase = resolve(workspacePath);

      if (!normalizedPath.startsWith(resolvedBase)) {
        logger.warn("Path traversal blocked", { entryName, resolvedPath: normalizedPath });
        throw new ValidationError(
          `Security: Path traversal detected in archive entry: ${entryName}`
        );
      }

      // Create subdirectories if needed
      const dir = entryName.substring(0, entryName.lastIndexOf("/"));
      if (dir) {
        mkdirSync(join(workspacePath, dir), { recursive: true });
      }

      // Extract the file
      const data = entry.getData();
      const writeStream = createWriteStream(fullPath);
      writeStream.write(data);
      writeStream.end();

      fileCount++;
      totalSizeBytes += data.length;

      // Safety check
      if (fileCount > MAX_FILES) {
        throw new ValidationError(`Extraction stopped: exceeds maximum of ${MAX_FILES} files.`);
      }
    }

    return { fileCount, totalSizeBytes };
  }

  /**
   * Stream ZIP upload from a ReadableStream.
   */
  async streamUpload(
    stream: ReadableStream<Uint8Array>,
    workspacePath: string
  ): Promise<{ buffer: Buffer; fileCount: number; totalSizeBytes: number }> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;

      if (totalLength > MAX_ZIP_SIZE_BYTES) {
        throw new ValidationError(`Upload exceeds maximum size of ${MAX_ZIP_SIZE_BYTES / 1024 / 1024} MB.`);
      }
    }

    const buffer = Buffer.concat(chunks);

    // Validate
    const validation = await this.validate(buffer, "upload.zip");
    if (!validation.valid) {
      throw new ValidationError(validation.message ?? "Invalid ZIP file.");
    }

    // Extract
    const result = await this.extract(buffer, workspacePath);
    return { buffer, ...result };
  }
}

export const zipService = new ZipService();
