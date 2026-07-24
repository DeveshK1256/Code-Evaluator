"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { FileText, BarChart3, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";

interface ReportSession {
  id: string;
  repository_id: string;
  status: string;
  overall_score: number;
  overall_grade: string;
  selected_modules: string[];
  started_at: string;
  completed_at: string | null;
}

export default function ReportsPage() {
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const json = await res.json();
      setSessions(json.data?.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Evaluation results and exportable reports"
      >
        <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
          Refresh
        </Button>
      </PageHeader>

      {isLoading ? (
        <LoadingOverlay label="Loading reports..." />
      ) : error ? (
        <ErrorState title="Failed to Load" message={error} onRetry={fetchReports} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No reports yet"
          description="Completed evaluations will appear here. Import a repository and run an analysis to generate reports."
          action={
            <Link href="/analysis">
              <Button>Import Repository</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link key={session.id} href={`/reports/${session.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {session.status === "complete" ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      ) : session.status === "failed" ? (
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      ) : (
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Repository: {session.repository_id?.slice(0, 8)}...</span>
                          <Badge variant={session.status === "complete" ? "success" : "secondary"}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(session.started_at).toLocaleDateString()}</span>
                          <span>{session.selected_modules?.length ?? 0} modules</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.overall_score != null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">{session.overall_score}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      )}
                      {session.overall_grade && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{session.overall_grade}</div>
                          <div className="text-xs text-muted-foreground">Grade</div>
                        </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
