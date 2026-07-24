"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { ErrorState } from "@/components/common/error-state";
import {
  BarChart3, Brain, Code, Shield, Zap, CheckCircle2,
  AlertTriangle, GitBranch, FileText, Star, Target,
  TrendingUp, Network, Clock, Settings,
  Download, Share2, Search, Github, Upload, ArrowRight,
} from "lucide-react";

interface EvalSession {
  id: string; repository_id: string; overall_score: number;
  overall_grade: string; overall_confidence: number;
  selected_modules: string[]; started_at: string; completed_at: string | null;
}

interface RepoSummary {
  id: string; name: string; source: string; status: string;
  primaryLanguage?: string; fileCount?: number; stars?: number;
}

function getGradeColor(grade: string): string {
  if (grade?.startsWith("A")) return "text-emerald-500";
  if (grade?.startsWith("B")) return "text-blue-500";
  if (grade?.startsWith("C")) return "text-amber-500";
  return "text-red-500";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<EvalSession[]>([]);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/reports").then((r) => r.json()).catch(() => ({ data: { sessions: [] } })),
      fetch("/api/v1/repositories").then((r) => r.json()).catch(() => ({ data: { repositories: [] } })),
    ]).then(([reportsRes, reposRes]) => {
      setSessions(reportsRes.data?.sessions ?? []);
      setRepos(reposRes.data?.repositories ?? []);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay label="Loading dashboard..." />;
  if (error) return <ErrorState title="Error" message={error} />;

  const latestSession = sessions[0] as EvalSession | undefined;
  const readyRepos = repos.filter((r) => r.status === "ready_for_analysis");
  const completeRepos = repos.filter((r) => r.status === "evaluation_complete");
  const total = repos.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? "repository" : "repositories"} ·{" "}
            {latestSession
              ? `Last evaluated ${new Date(latestSession.started_at).toLocaleDateString()}`
              : "No evaluations yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analysis">
            <Button size="sm">+ New Analysis</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Repositories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-500">{completeRepos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Evaluations Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{readyRepos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for Analysis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{latestSession?.overall_score ?? "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Latest Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Evaluation */}
      {latestSession && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold">{latestSession.overall_score}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                <div className="h-12 w-px bg-border hidden lg:block" />
                <div>
                  <div className={`text-4xl font-bold ${getGradeColor(latestSession.overall_grade ?? "")}`}>
                    {latestSession.overall_grade ?? "N/A"}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{latestSession.selected_modules?.length ?? 0} modules evaluated</span>
                    <span>·</span>
                    <span>{new Date(latestSession.started_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/reports/${latestSession.id}`}>
                  <Button variant="outline" size="sm">View Report</Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" size="sm">All Reports</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repositories List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Repositories</CardTitle>
          <Link href="/repositories">
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {repos.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No repositories imported yet.</p>
              <Link href="/analysis">
                <Button variant="outline" size="sm" className="mt-3">Import a Repository</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {repos.slice(0, 5).map((repo) => (
                <Link key={repo.id} href={`/repositories/${repo.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {repo.source === "github" ? <Github className="h-4 w-4 text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <span className="text-sm font-medium">{repo.name}</span>
                        {repo.primaryLanguage && <span className="text-xs text-muted-foreground ml-2">· {repo.primaryLanguage}</span>}
                      </div>
                    </div>
                    <Badge variant={
                      repo.status === "ready_for_analysis" || repo.status === "evaluation_complete" ? "success"
                      : repo.status === "failed" ? "destructive"
                      : "secondary"
                    }>
                      {repo.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Evaluations */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Evaluations</CardTitle>
            <Link href="/reports">
              <Button variant="ghost" size="sm">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <Link key={s.id} href={`/reports/${s.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <div>
                        <span className="text-sm font-medium">Evaluation #{s.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground ml-2">· {new Date(s.started_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{s.overall_score ?? "—"}</span>
                      <span className={`text-sm font-semibold ${getGradeColor(s.overall_grade ?? "")}`}>{s.overall_grade ?? "—"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Welcome to Code Evaluator</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Import a repository and run an evaluation to see your dashboard.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/analysis">
                <Button><Github className="h-4 w-4 mr-2" /> Import from GitHub</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
