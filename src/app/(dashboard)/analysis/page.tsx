"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/common/spinner";
import {
  ArrowRight, Github, Upload, X, CheckCircle2,
  AlertCircle, FileWarning, Loader2,
} from "lucide-react";

type UploadStatus = "idle" | "validating" | "uploading" | "processing" | "completed" | "error";

interface UploadState {
  status: UploadStatus;
  progress: number;
  message: string;
  repositoryId?: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [githubState, setGithubState] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string; repoId?: string }>({ status: "idle" });
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", progress: 0, message: "" });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── GitHub URL Import ─────────────────────────────────

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setGithubState({ status: "loading", message: "Validating repository..." });

    try {
      const res = await fetch("/api/v1/repositories/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: repoUrl }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json?.error?.message
          ? String(json.error.message)
          : json?.error
            ? String(json.error)
            : "Failed to import repository";
        setGithubState({ status: "error", message: errorMsg });
        return;
      }

      setGithubState({
        status: "success",
        message: "Repository imported successfully!",
        repoId: json.data.id,
      });

      // Navigate to detail after short delay
      setTimeout(() => {
        router.push(`/repositories/${json.data.id}`);
      }, 1500);
    } catch {
      setGithubState({ status: "error", message: "Network error. Please try again." });
    }
  };

  // ─── ZIP Upload ────────────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setUploadState({ status: "error", progress: 0, message: "Only .zip files are supported." });
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState({
        status: "error",
        progress: 0,
        message: `File exceeds ${maxSize / 1024 / 1024} MB limit.`,
      });
      return;
    }

    setUploadState({ status: "validating", progress: 10, message: "Validating file..." });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 60) + 10;
          setUploadState({ status: "uploading", progress: pct, message: "Uploading..." });
        }
      });

      const result = await new Promise<{ success: boolean; data?: { id: string }; error?: { message: string } }>(
        (resolve, reject) => {
          xhr.addEventListener("load", () => {
            try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Invalid response")); }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", "/api/v1/repositories/upload");
          xhr.send(formData);
        }
      );

      if (!result.success || !result.data) {
        setUploadState({
          status: "error",
          progress: 0,
          message: result.error?.message ?? "Upload failed",
        });
        return;
      }

      const repoId = result.data.id;
      setUploadState({
        status: "processing",
        progress: 80,
        message: "Processing uploaded files...",
        repositoryId: repoId,
      });

      // Poll for completion
      const checkStatus = async () => {
        if (!repoId) return;
        try {
          const statusRes = await fetch(`/api/v1/repositories/${repoId}/status`);
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            if (statusJson.data?.status === "ready_for_analysis" || statusJson.data?.status === "failed") {
              if (statusJson.data.status === "ready_for_analysis") {
                setUploadState((prev) => ({ ...prev, status: "completed", progress: 100, message: "Upload complete!" }));
                setTimeout(() => router.push(`/repositories/${repoId}`), 1000);
              } else {
                setUploadState({ status: "error", progress: 0, message: "Processing failed" });
              }
              return;
            }
            setUploadState((prev) => ({
              ...prev,
              progress: Math.min(95, (statusJson.data?.progress ?? 80) + 10),
            }));
          }
        } catch { /* ignore */ }
        setTimeout(checkStatus, 2000);
      };

      setTimeout(checkStatus, 2000);
    } catch (err) {
      setUploadState({ status: "error", progress: 0, message: err instanceof Error ? err.message : "Upload failed" });
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleCancel = () => {
    setUploadState({ status: "idle", progress: 0, message: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Render ────────────────────────────────────────────

  const isProcessing = githubState.status === "loading" ||
    ["validating", "uploading", "processing"].includes(uploadState.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Repository"
        description="Submit a GitHub repository or upload code for evaluation"
      />

      <Tabs defaultValue="github">
        <TabsList>
          <TabsTrigger value="github">
            <Github className="h-4 w-4 mr-2" />
            GitHub URL
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload ZIP
          </TabsTrigger>
        </TabsList>

        {/* ─── GitHub Tab ─────────────────────────────── */}
        <TabsContent value="github">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Repository</CardTitle>
              <CardDescription>Enter a public GitHub repository URL to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGitHubSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-url">Repository URL</Label>
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isProcessing}
                    error={githubState.status === "error" ? githubState.message : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports URLs like: https://github.com/owner/repo or https://github.com/owner/repo/tree/main
                  </p>
                </div>

                {githubState.status === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner size="sm" />
                    {githubState.message}
                  </div>
                )}

                {githubState.status === "success" && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {githubState.message}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" disabled={isProcessing || !repoUrl.trim()}>
                    {githubState.status === "loading" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                    ) : (
                      <><Github className="mr-2 h-4 w-4" /> Import Repository</>
                    )}
                  </Button>
                  {githubState.status === "success" && githubState.repoId && (
                    <Button variant="outline" onClick={() => router.push(`/repositories/${githubState.repoId}`)}>
                      View Repository
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Upload Tab ─────────────────────────────── */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Code</CardTitle>
              <CardDescription>Upload a ZIP file of your project for analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              {uploadState.status === "idle" && (
                <div
                  className={`relative flex items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload ZIP file"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      Drag and drop your ZIP file here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse · Max 100 MB
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Browse Files
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* Upload Progress */}
              {uploadState.status !== "idle" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {uploadState.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : uploadState.status === "error" ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      <span className="text-sm font-medium">{uploadState.message}</span>
                    </div>
                    {uploadState.status !== "completed" && uploadState.status !== "error" && (
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                  <Progress value={uploadState.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{uploadState.progress}%</p>
                </div>
              )}

              {/* Retry */}
              {uploadState.status === "error" && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Requirements</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ZIP format only
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Max 100 MB file size
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Max 50,000 files per archive
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FileWarning className="h-3 w-3 text-amber-500" />
                    Hidden files and build artifacts are excluded
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
