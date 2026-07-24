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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Github, Upload, Clock, FileText, Star,
  GitFork, GitBranch, AlertCircle, CheckCircle2, Loader2,
  Play,
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
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [availModules, setAvailModules] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [readme, setReadme] = useState("");
  const [problemStatement, setProblemStatement] = useState("");

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

  // Fetch available evaluation modules
  useEffect(() => {
    fetch("/api/v1/evaluation")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.modules) {
          setAvailModules(json.data.modules);
          setSelectedModules(new Set(json.data.modules.map((m: { id: string }) => m.id)));
        }
      })
      .catch(() => {});
  }, []);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleStartAnalysis = async () => {
    if (selectedModules.size === 0) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/v1/evaluation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: id,
          selectedModules: Array.from(selectedModules),
          readme: readme || undefined,
          problemStatement: problemStatement || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to start analysis");
      }
      setAnalysisOpen(false);
      if (repo) setRepo({ ...repo, status: "analysis_running", progress: 10, statusMessage: "Analysis queued..." });
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Poll for progress updates
  useEffect(() => {
    if (!repo) return;
    if (repo.progress >= 100 || repo.status === "failed" || repo.status === "ready_for_analysis" || repo.status === "evaluation_complete") return;

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

      {/* Start Analysis */}
      {repo.status === "ready_for_analysis" && (
        <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full">
              <Play className="h-5 w-5 mr-2" />
              Start Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Start Analysis</DialogTitle>
              <DialogDescription>
                Select the evaluation criteria to analyze your repository against.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Modules */}
              <div className="space-y-3">
                <Label>Evaluation Criteria</Label>
                {availModules.map((mod) => (
                  <label
                    key={mod.id}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedModules.has(mod.id)}
                      onChange={() => toggleModule(mod.id)}
                    />
                    <div>
                      <div className="font-medium text-sm">{mod.name}</div>
                      {mod.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{mod.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Optional inputs */}
              <div className="space-y-2">
                <Label htmlFor="readme">README (optional)</Label>
                <Textarea
                  id="readme"
                  placeholder="Paste your README content for better context..."
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement (optional)</Label>
                <Textarea
                  id="problem"
                  placeholder="Describe the problem your project solves..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={2}
                />
              </div>

              {analysisError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {analysisError}
                </div>
              )}

              {availModules.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No evaluation modules available. The repository must be fully processed first.
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAnalysisOpen(false)} disabled={analysisLoading}>
                Cancel
              </Button>
              <Button onClick={handleStartAnalysis} disabled={availModules.length > 0 && selectedModules.size === 0 || analysisLoading}>
                {analysisLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : "Run Analysis"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
