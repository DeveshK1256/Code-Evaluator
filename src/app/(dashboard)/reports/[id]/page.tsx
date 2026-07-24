"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { ErrorState } from "@/components/common/error-state";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Clock, BarChart3,
  Target, Shield, Zap, FileText, Star, Lightbulb, AlertTriangle,
} from "lucide-react";

interface ModuleResult {
  id: string; module_id: string; module_name: string; score: number;
  grade: string; summary: string; strengths: unknown[]; weaknesses: unknown[];
  recommendations: unknown[];
}

interface ReportData {
  session: Record<string, unknown>;
  modules: ModuleResult[];
  recommendations: Record<string, unknown>[];
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/v1/reports?sessionId=${id}`);
        if (!res.ok) throw new Error("Report not found");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (isLoading) return <LoadingOverlay label="Loading report..." />;
  if (error) return <ErrorState title="Error" message={error} />;
  if (!data) return <ErrorState title="Not Found" message="Report not found" />;

  const { session } = data;
  const score = session.overall_score as number;
  const grade = session.overall_grade as string;

  const getGradeColor = (g: string) => {
    if (g.startsWith("A")) return "text-emerald-500";
    if (g.startsWith("B")) return "text-blue-500";
    if (g.startsWith("C")) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Reports", href: "/reports" },
        { label: `Report ${id.slice(0, 8)}` },
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Evaluation Report</h1>
            <Badge variant={session.status === "complete" ? "success" : "secondary"}>
              {session.status as string}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(session.started_at as string).toLocaleDateString()}
            {(session.completed_at as string) && ` — Completed ${new Date(session.completed_at as string).toLocaleDateString()}`}
          </p>
        </div>
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
      </div>

      {/* Score Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="text-5xl font-bold">{score ?? "—"}/100</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className={`text-5xl font-bold ${getGradeColor(grade)}`}>{grade ?? "—"}</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Modules</p>
              <p className="text-5xl font-bold">{data.modules.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Results */}
      <h2 className="text-xl font-semibold mt-8">Module Results</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {data.modules.map((mod) => (
          <Card key={mod.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{mod.module_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{mod.score}</span>
                  <span className={`text-sm font-semibold ${getGradeColor(mod.grade)}`}>{mod.grade}</span>
                </div>
              </div>
              <CardDescription>{mod.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              {mod.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Strengths ({mod.strengths.length})
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {(mod.strengths as Array<{ title: string }>).slice(0, 3).map((s, i) => (
                      <p key={i}>• {s.title}</p>
                    ))}
                  </div>
                </div>
              )}
              {mod.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Areas to Improve ({mod.weaknesses.length})
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {(mod.weaknesses as Array<{ title: string }>).slice(0, 3).map((w, i) => (
                      <p key={i}>• {w.title}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8">Recommendations</h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <Card key={(rec.id as string) ?? i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{rec.title as string}</span>
                        <Badge variant={
                          rec.severity === "critical" ? "destructive"
                          : rec.severity === "high" ? "warning"
                          : "secondary"
                        }>
                          {rec.severity as string}
                        </Badge>
                      </div>
                      {(rec.description != null && rec.description !== "") && (
                        <p className="text-xs text-muted-foreground mt-1">{String(rec.description)}</p>
                      )}
                      {(rec.estimated_effort != null && rec.estimated_effort !== "") && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Effort: <span className="font-medium">{String(rec.estimated_effort)}</span>
                          {rec.expected_improvement != null && ` · +${Number(rec.expected_improvement)} pts`}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
