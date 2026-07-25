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
  Download, FileJson, FileSpreadsheet,
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

  // ─── Download Handlers ──────────────────────────────────
  const downloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${id.slice(0, 8)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMarkdown = () => {
    if (!data) return;
    const { session, modules, recommendations } = data;
    const lines: string[] = [];
    lines.push(`# Evaluation Report\n`);
    lines.push(`**Date:** ${new Date(session.started_at as string).toLocaleDateString()}`);
    lines.push(`**Status:** ${session.status as string}`);
    lines.push(`**Overall Score:** ${session.overall_score as number}/100`);
    lines.push(`**Grade:** ${session.overall_grade as string}\n`);
    lines.push(`---\n`);
    for (const mod of modules) {
      lines.push(`## ${mod.module_name}\n`);
      lines.push(`**Score:** ${mod.score} (${mod.grade})\n`);
      lines.push(`**Summary:** ${mod.summary}\n`);
      if (mod.strengths.length > 0) {
        lines.push(`### Strengths\n`);
        for (const s of mod.strengths as Array<{ title: string; description: string }>) {
          lines.push(`- **${s.title}**: ${s.description}`);
        }
        lines.push(``);
      }
      if (mod.weaknesses.length > 0) {
        lines.push(`### Areas to Improve\n`);
        for (const w of mod.weaknesses as Array<{ title: string; description: string }>) {
          lines.push(`- **${w.title}**: ${w.description}`);
        }
        lines.push(``);
      }
    }
    if (recommendations.length > 0) {
      lines.push(`---\n## Recommendations\n`);
      for (const rec of recommendations as Array<{ title: string; severity: string; suggestedFix?: string; estimated_effort?: string }>) {
        lines.push(`- **${rec.title}** (${rec.severity})`);
        if (rec.suggestedFix) lines.push(`  - Fix: ${rec.suggestedFix}`);
        lines.push(``);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${id.slice(0, 8)}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!data) return;
    const rows = [["Module", "Score", "Grade", "Summary"]];
    for (const mod of data.modules) {
      rows.push([mod.module_name, String(mod.score), mod.grade, mod.summary.replace(/"/g, "'")]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-${id.slice(0, 8)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon" className="-ml-2 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
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
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={downloadJSON} title="Download as JSON">
            <FileJson className="h-4 w-4 mr-1" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={downloadMarkdown} title="Download as Markdown">
            <FileText className="h-4 w-4 mr-1" /> MD
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV} title="Download as CSV">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} title="Print / Save as PDF">
            <Download className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>
          </Link>
        </div>
        {/* Download Buttons */}
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={downloadJSON} title="Download as JSON">
            <FileJson className="h-4 w-4 mr-1" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={downloadMarkdown} title="Download as Markdown">
            <FileText className="h-4 w-4 mr-1" /> MD
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV} title="Download as CSV">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} title="Print / Save as PDF">
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
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
                  <div className="text-xs text-muted-foreground space-y-1">
                    {(mod.strengths as Array<{ title: string; description: string }>).slice(0, 4).map((s, i) => (
                      <p key={i}><span className="font-medium">{s.title}</span>: {s.description}</p>
                    ))}
                  </div>
                </div>
              )}
              {mod.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Areas to Improve ({mod.weaknesses.length})
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {(mod.weaknesses as Array<{ title: string; description: string }>).slice(0, 4).map((w, i) => (
                      <p key={i}><span className="font-medium">{w.title}</span>: {w.description}</p>
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
