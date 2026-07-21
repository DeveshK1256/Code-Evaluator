import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { rmSync } from "fs";
import { FileDiscoveryService } from "@/services/file-discovery.service";

const service = new FileDiscoveryService();
let testDir: string;

describe("FileDiscoveryService", () => {
  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), "fds-test-"));
    // Create test files
    mkdirSync(join(testDir, "src"));
    mkdirSync(join(testDir, "src/components"));
    mkdirSync(join(testDir, ".git"), { recursive: true }); // Should be excluded
    writeFileSync(join(testDir, "src/index.ts"), "const x = 1;");
    writeFileSync(join(testDir, "src/components/button.tsx"), "export const Button = () => null;");
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "test" }));
    writeFileSync(join(testDir, "README.md"), "# Test");
    writeFileSync(join(testDir, ".env"), "SECRET=value"); // Hidden file
    writeFileSync(join(testDir, "logo.png"), Buffer.alloc(100)); // Binary file
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("scans files and builds directory tree", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.directoryTree.length).toBeGreaterThan(0);
  });

  it("excludes .git directory", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    const gitFiles = result.files.filter((f) => f.path.includes(".git"));
    expect(gitFiles.length).toBe(0);
  });

  it("detects binary files", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    const binary = result.files.find((f) => f.name === "logo.png");
    expect(binary?.isBinary).toBe(true);
  });

  it("detects hidden files", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    const hidden = result.files.find((f) => f.name === ".env");
    expect(hidden?.isHidden).toBe(true);
  });

  it("generates content fingerprint", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    const fingerprint = service.generateFingerprint(result.directoryTree);
    expect(fingerprint).toBeTruthy();
    expect(typeof fingerprint).toBe("string");
    expect(fingerprint.length).toBe(64); // SHA-256 hex
  });

  it("computes correct summary statistics", async () => {
    const result = await service.scan(testDir, "test-repo-id");
    expect(result.summary.totalFiles).toBe(result.files.length);
    expect(result.summary.totalSizeBytes).toBeGreaterThan(0);
    expect(result.summary.extensions).toBeDefined();
    expect(result.summary.largestFiles.length).toBeGreaterThan(0);
  });
});
