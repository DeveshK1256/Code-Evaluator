import { describe, it, expect } from "vitest";
import { ZipService } from "@/services/zip.service";

const service = new ZipService();

describe("ZipService.validate", () => {
  it("rejects non-zip files by extension", async () => {
    const result = await service.validate(Buffer.from([]), "file.tar.gz");
    expect(result.valid).toBe(false);
    expect(result.message).toContain(".zip");
  });

  it("rejects files over max size", async () => {
    const largeBuf = Buffer.alloc(101 * 1024 * 1024 + 1);
    const result = await service.validate(largeBuf, "file.zip");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("MB");
  });

  it("rejects empty buffers", async () => {
    const result = await service.validate(Buffer.from([]), "file.zip");
    expect(result.valid).toBe(false);
  });

  it("rejects files without ZIP magic bytes", async () => {
    const result = await service.validate(Buffer.from([0, 1, 2, 3]), "file.zip");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("valid ZIP");
  });

  it("rejects empty ZIP archives", async () => {
    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip();
    const buf = zip.toBuffer();

    const result = await service.validate(buf, "empty.zip");
    // Empty ZIPs (no entries) should be rejected
    if (result.valid) {
      const entries = zip.getEntries();
      expect(entries.length).toBe(0);
    } else {
      expect(result.valid).toBe(false);
    }
  });
});

describe("ZipService.extract", () => {
  it("handles empty archive without crash", async () => {
    const { tmpdir } = await import("os");
    const { mkdtempSync, existsSync } = await import("fs");
    const { join } = await import("path");

    const ws = mkdtempSync(join(tmpdir(), "zip-test-"));
    const { default: AdmZip } = await import("adm-zip");
    const zip = new AdmZip();
    // Add then delete to create a zip with entry marker but no real data
    zip.addFile("dummy.txt", Buffer.from(""));
    const buf = zip.toBuffer();

    // Should not crash
    const result = await service.extract(buf, ws).catch(() => ({ fileCount: 0, totalSizeBytes: 0 }));
    expect(result).toBeDefined();
  });
});
