"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { ErrorState } from "@/components/common/error-state";
import { GitBranch, Plus, Github, Upload, Trash2, ExternalLink, Clock } from "lucide-react";

interface RepoListItem {
  id: string;
  name: string;
  source: string;
  status: string;
  progress: number;
  primaryLanguage?: string;
  stars?: number;
  githubUrl?: string;
  createdAt: string;
  fileCount?: number;
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  pending: "secondary",
  uploading: "secondary",
  validating: "warning",
  extracting: "warning",
  scanning: "warning",
  detecting: "warning",
  manifest_ready: "success",
  ready_for_analysis: "success",
  analysis_running: "default",
  evaluation_complete: "success",
  failed: "destructive",
  archived: "outline",
};

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <Badge variant={statusColor[status] ?? "outline"}>{label}</Badge>;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRepos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/repositories");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const json = await res.json();
      setRepos(json.data?.repositories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRepos(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this repository and all its data?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/v1/repositories/${id}`, { method: "DELETE" });
      setRepos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete repository");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Repositories" description="Manage your source code repositories">
        <Link href="/analysis">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Repository
          </Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <LoadingOverlay label="Loading repositories..." />
      ) : error ? (
        <ErrorState title="Failed to Load" message={error} onRetry={fetchRepos} />
      ) : repos.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<GitBranch className="h-12 w-12" />}
              title="No repositories yet"
              description="Add a GitHub repository or upload your code to get started."
              action={
                <div className="flex gap-3">
                  <Link href="/analysis">
                    <Button>
                      <Github className="h-4 w-4 mr-2" />
                      Import from GitHub
                    </Button>
                  </Link>
                  <Link href="/analysis">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ZIP
                    </Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <Link key={repo.id} href={`/repositories/${repo.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {repo.source === "github" ? (
                        <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{repo.name}</span>
                          <StatusBadge status={repo.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(repo.createdAt).toLocaleDateString()}
                          </span>
                          {repo.primaryLanguage && <span>{repo.primaryLanguage}</span>}
                          {repo.fileCount !== undefined && <span>{repo.fileCount} files</span>}
                          {repo.stars !== undefined && repo.stars > 0 && <span>{repo.stars} ★</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {repo.source === "github" && repo.githubUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.preventDefault(); window.open(repo.githubUrl, "_blank"); }}
                          aria-label="Open on GitHub"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); handleDelete(repo.id); }}
                        disabled={deleting === repo.id}
                        aria-label="Delete repository"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {/* Progress bar for in-progress repos */}
                  {repo.progress > 0 && repo.progress < 100 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{ width: `${repo.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
