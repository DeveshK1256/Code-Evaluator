"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { ErrorState } from "@/components/common/error-state";
import {
  ArrowLeft, Github, Upload, Clock, FileText, Star,
  GitFork, GitBranch, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import type { Repository, TechnologyItem } from "@/types/repository";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" />, color: "text-muted-foreground" },
  uploading: { label: "Uploading", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-blue-500" },
  validating: { label: "Validating", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-amber-500" },
  extracting: { label: "Extracting", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-amber-500" },
  scanning: { label: "Scanning", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-blue-500" },
  detecting: { label: "Detecting Technologies", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-blue-500" },
  manifest_ready: { label: "Manifest Ready", icon: <FileText className="h-4 w-4" />, color: "text-emerald-500" },
  ready_for_analysis: { label: "Ready for Analysis", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500" },
  analysis_running: { label: "Analysis Running", icon: <Loader2 className="h-4 w-4 animate-spin" />, color: "text-blue-500" },
  evaluation_complete: { label: "Complete", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500" },
  failed: { label: "Failed", icon: <AlertCircle className="h-4 w-4" />, color: "text-red-500" },
  archived: { label: "Archived", icon: <Clock className="h-4 w-4" />, color: "text-muted-foreground" },
};

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [technologies, setTechnologies] = useState<TechnologyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [repoRes, manifestRes] = await Promise.all([
        fetch(`/api/v1/repositories/${id}`),
        fetch(`/api/v1/repositories/${id}/manifest`).catch(() => null),
      ]);

      if (!repoRes.ok) throw new Error("Repository not found");
      const repoJson = await repoRes.json();
      setRepo(repoJson.data);

      if (manifestRes?.ok) {
        const manifestJson = await manifestRes.json();
        const techs: TechnologyItem[] = [];
        const cats = manifestJson.data?.technologies?.categories ?? {};
        for (const items of Object.values(cats) as TechnologyItem[][]) {
          techs.push(...items);
        }
        setTechnologies(techs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repository");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Poll for progress updates
  useEffect(() => {
    if (!repo) return;
    if (repo.progress >= 100 || repo.status === "failed" || repo.status === "ready_for_analysis") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/repositories/${id}/status`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setRepo((prev) => prev ? { ...prev, ...json.data } : prev);
            if (json.data.status === "ready_for_analysis" || json.data.status === "failed") {
              clearInterval(interval);
              fetchData();
            }
          }
        }
      } catch { /* ignore polling errors */ }
    }, 2000);

    return () => clearInterval(interval);
  }, [repo?.id, repo?.status]);

  if (isLoading) return <LoadingOverlay isLoading label="Loading repository..." />;
  if (error) return <ErrorState title="Error" message={error} onRetry={fetchData} />;
  if (!repo) return <ErrorState title="Not Found" message="Repository not found" />;

  const statusInfo = statusConfig[repo.status as keyof typeof statusConfig] ?? statusConfig.pending!;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Repositories", href: "/repositories" },
        { label: repo.name },
      ]} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/repositories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{repo.name}</h1>
              <Badge variant={repo.status === "ready_for_analysis" ? "success" : repo.status === "failed" ? "destructive" : "secondary"}>
                <span className={`flex items-center gap-1 ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {repo.source === "github" && repo.githubUrl && (
                <a href={repo.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                  <Github className="h-4 w-4" />
                  {repo.githubOwner}/{repo.githubRepo}
                </a>
              )}
              {repo.source !== "github" && (
                <span className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  ZIP Upload
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(repo.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {repo.progress > 0 && repo.progress < 100 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{repo.statusMessage ?? "Processing..."}</span>
              <span className="text-sm text-muted-foreground">{repo.progress}%</span>
            </div>
            <Progress value={repo.progress} />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{repo.fileCount ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {repo.sizeBytes ? `${(repo.sizeBytes / 1024 / 1024).toFixed(1)} MB` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{repo.primaryLanguage ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-2xl font-bold">
              <Star className="h-5 w-5 text-amber-500" />
              {repo.stars ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technologies */}
      {technologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tech.name}
                  {tech.category && <span className="ml-1 opacity-60">· {tech.category}</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GitHub Metadata */}
      {repo.githubUrl && (
        <Card>
          <CardHeader>
            <CardTitle>GitHub Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-muted-foreground" />
                <span>{repo.forks ?? 0} forks</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>{repo.openIssues ?? 0} open issues</span>
              </div>
              {repo.defaultBranch && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span>Default branch: {repo.defaultBranch}</span>
                </div>
              )}
              {repo.topics && repo.topics.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {repo.topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
