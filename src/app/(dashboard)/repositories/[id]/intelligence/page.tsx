"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import {
  ArrowLeft, Brain, Building2, ListChecks, Shield,
  BookOpen, FileText, GitBranch, Network, AlertCircle,
  CheckCircle2, Loader2, Zap,
} from "lucide-react";

interface IntelligenceData {
  summary?: { name: string; description: string; purpose: string; targetUsers: string[]; confidence: number; isInferred: boolean };
  architecture?: { pattern: string; patternConfidence: number; layers: string[]; modules: Array<{ name: string; description: string }>; keyFiles: Array<{ path: string; importance: string }>; confidence: number; isInferred?: boolean };
  features?: { features: Array<{ name: string; description: string; category: string; status: string; confidence: number }>; confidence: number };
  auth?: { provider: string; type: string; confidence: number; isInferred: boolean };
  documentation?: { hasReadme: boolean; readmeSummary: string; documentationQuality: string };
  knowledgeGraph?: { nodes: Array<{ id: string; type: string; name: string }>; confidence?: number };
  metadata?: { processingDurationMs: number; totalTokensUsed: number; agentCount: number };
}

export default function RepositoryIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("pending");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/v1/intelligence/${id}/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.status) {
          setSessionStatus(json.data.status);
          setProgress(json.data.progress ?? 0);
          if (json.data.status === "complete") {
            fetchIntelligence();
          }
        }
      }
    } catch { /* ignore */ }
  };

  const fetchIntelligence = async () => {
    try {
      const res = await fetch(`/api/v1/intelligence/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setSessionStatus("complete");
          setProgress(100);
        }
      }
    } catch {
      // Not found yet
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchStatus();
      setIsLoading(false);
    };
    init();
  }, [id]);

  // Poll during analysis
  useEffect(() => {
    if (sessionStatus === "complete" || sessionStatus === "failed" || sessionStatus === "pending") return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [sessionStatus]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/v1/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: id }),
      });
      if (res.ok) {
        setSessionStatus("chunking");
        setProgress(5);
      }
    } catch {
      setError("Failed to start analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const patternColors: Record<string, string> = {
    monolith: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    modular_monolith: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
    microservices: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    layered: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
    feature_based: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    mvc: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
    unknown: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  };

  const formatPattern = (p: string) => p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  if (isLoading) return <LoadingOverlay isLoading label="Loading intelligence data..." />;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Repositories", href: "/repositories" },
        { label: "Repository", href: `/repositories/${id}` },
        { label: "Intelligence" },
      ]} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/repositories/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Repository Intelligence</h1>
              {sessionStatus === "complete" && <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Badge>}
              {sessionStatus === "failed" && <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>}
              {sessionStatus !== "complete" && sessionStatus !== "failed" && sessionStatus !== "pending" && (
                <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress / Start */}
      {(sessionStatus === "pending" || sessionStatus === "chunking" || sessionStatus?.includes("analyzing") || sessionStatus === "building_knowledge_graph") && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                {sessionStatus === "chunking" && <><Loader2 className="h-4 w-4 animate-spin" /> Chunking repository...</>}
                {sessionStatus?.includes("analyzing") && <><Brain className="h-4 w-4 animate-spin" /> Running AI agents...</>}
                {sessionStatus === "building_knowledge_graph" && <><Network className="h-4 w-4 animate-spin" /> Building knowledge graph...</>}
                {sessionStatus === "pending" && "Ready to analyze"}
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
            {sessionStatus === "pending" && (
              <Button className="mt-4" onClick={startAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                Start Intelligence Analysis
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && <ErrorState title="Analysis Failed" message={error} onRetry={startAnalysis} />}

      {/* Intelligence Content */}
      {data ? (
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview"><Brain className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="architecture"><Building2 className="h-4 w-4 mr-2" />Architecture</TabsTrigger>
            <TabsTrigger value="features"><ListChecks className="h-4 w-4 mr-2" />Features</TabsTrigger>
            <TabsTrigger value="knowledge-graph"><Network className="h-4 w-4 mr-2" />Knowledge Graph</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            {data.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Repository Summary
                    {data.summary.isInferred && <Badge variant="outline" className="text-[10px]">AI Inferred</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Purpose</h3>
                    <p>{data.summary.purpose || data.summary.description}</p>
                  </div>
                  {data.summary.targetUsers && data.summary.targetUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Target Users</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.summary.targetUsers.map((u, i) => (
                          <Badge key={i} variant="secondary">{u}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Confidence: {((data.summary.confidence ?? 0) * 100).toFixed(0)}%
                    </span>
                    {data.metadata && (
                      <>
                        <span>Agents: {data.metadata.agentCount}</span>
                        <span>Tokens: {(data.metadata.totalTokensUsed ?? 0).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.auth && data.auth.provider !== "unknown" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Authentication
                    {data.auth.isInferred && <Badge variant="outline" className="text-[10px]">AI Inferred</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{data.auth.provider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{data.auth.type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {((data.auth.confidence ?? 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.documentation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Quality:</span>
                      <Badge variant={data.documentation.documentationQuality === "excellent" || data.documentation.documentationQuality === "good" ? "success" : "secondary"}>
                        {data.documentation.documentationQuality}
                      </Badge>
                    </div>
                    {data.documentation.readmeSummary && (
                      <p className="text-muted-foreground text-xs">{data.documentation.readmeSummary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Architecture */}
          <TabsContent value="architecture" className="space-y-4">
            {data.architecture ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Architecture Pattern
                      {data.architecture?.isInferred ? <Badge variant="outline" className="text-[10px]">AI Inferred</Badge> : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${patternColors[data.architecture.pattern] ?? patternColors.unknown}`}>
                      <Building2 className="h-4 w-4" />
                      {formatPattern(data.architecture.pattern)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {((data.architecture.patternConfidence ?? 0) * 100).toFixed(0)}%
                    </p>
                  </CardContent>
                </Card>

                {data.architecture.layers && data.architecture.layers.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Layers</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {data.architecture.layers.map((layer, i) => (
                          <Badge key={i} variant="outline">{layer}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {data.architecture.modules && data.architecture.modules.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Modules</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.architecture.modules.slice(0, 10).map((mod, i) => (
                          <div key={i} className="border-b pb-2 last:border-0">
                            <p className="font-medium text-sm">{mod.name}</p>
                            <p className="text-xs text-muted-foreground">{mod.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {data.architecture.keyFiles && data.architecture.keyFiles.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Key Files</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {data.architecture.keyFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{f.path}</code>
                            <Badge variant={f.importance === "critical" ? "destructive" : f.importance === "high" ? "warning" : "secondary"} className="text-[10px]">
                              {f.importance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <EmptyState icon={<Building2 className="h-12 w-12" />} title="No architecture data" description="Run intelligence analysis to see architecture information." />
            )}
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-4">
            {data.features && data.features.features.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.features.features.map((feat, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{feat.name}</CardTitle>
                        <Badge variant={feat.status === "complete" ? "success" : feat.status === "partial" ? "warning" : "secondary"} className="text-[10px]">
                          {feat.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{feat.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Category: {feat.category}</span>
                        <span>Confidence: {((feat.confidence ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={<ListChecks className="h-12 w-12" />} title="No features detected" description="Run intelligence analysis to extract features." />
            )}
          </TabsContent>

          {/* Knowledge Graph */}
          <TabsContent value="knowledge-graph" className="space-y-4">
            {data.knowledgeGraph && data.knowledgeGraph.nodes.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Knowledge Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Nodes</span>
                        <span className="font-medium">{data.knowledgeGraph.nodes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium">{((data.knowledgeGraph.confidence ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Nodes by Type</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        data.knowledgeGraph.nodes.reduce<Record<string, number>>((acc, n) => {
                          acc[n.type] = (acc[n.type] ?? 0) + 1;
                          return acc;
                        }, {})
                      ).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyState icon={<Network className="h-12 w-12" />} title="No knowledge graph" description="Run intelligence analysis to generate the knowledge graph." />
            )}
          </TabsContent>
        </Tabs>
      ) : sessionStatus === "complete" ? (
        <EmptyState
          icon={<Zap className="h-12 w-12" />}
          title="No Data"
          description="Analysis completed but no intelligence data was found."
          action={<Button onClick={startAnalysis}>Re-run Analysis</Button>}
        />
      ) : null}
    </div>
  );
}
