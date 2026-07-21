"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Brain, Code, Shield, Zap, CheckCircle2,
  AlertTriangle, GitBranch, FileText, Star, Target,
  TrendingUp, Network, Clock, Settings, ChevronRight,
  Download, Share2, Search,
} from "lucide-react";

// ─── Dashboard Data ──────────────────────────────────────────────────
const dashboardData = {
  overallScore: 82,
  overallGrade: "B",
  confidence: 0.84,
  lastAnalyzed: "2026-07-21T14:30:00Z",
  repository: {
    name: "my-awesome-project",
    language: "TypeScript",
    framework: "Next.js 15",
    architecture: "Feature-based",
    files: 342,
    stars: 128,
  },
  moduleScores: [
    { name: "Code Quality", score: 78, grade: "B+", icon: Code },
    { name: "Security", score: 72, grade: "B", icon: Shield },
    { name: "Performance", score: 85, grade: "A-", icon: Zap },
    { name: "Testing", score: 65, grade: "C+", icon: CheckCircle2 },
    { name: "Accessibility", score: 70, grade: "B-", icon: Target },
    { name: "Google Services", score: 88, grade: "A-", icon: Star },
    { name: "Problem Alignment", score: 90, grade: "A-", icon: Brain },
    { name: "Architecture", score: 80, grade: "B+", icon: GitBranch },
    { name: "Documentation", score: 75, grade: "B", icon: FileText },
  ],
  recommendationsCount: 24,
  criticalCount: 3,
  highCount: 8,
  techDebt: 32,
  productionReadiness: 78,
  hackathonReadiness: 88,
  recentActivity: [
    { action: "Evaluation completed", time: "2 hours ago" },
    { action: "Repository imported", time: "2 hours ago" },
    { action: "Intelligence analysis complete", time: "2 hours ago" },
  ],
};

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-emerald-500";
  if (grade.startsWith("B")) return "text-blue-500";
  if (grade.startsWith("C")) return "text-amber-500";
  return "text-red-500";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const data = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {data.repository.name} · Last analyzed {new Date(data.lastAnalyzed).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/analysis">
            <Button size="sm">New Analysis</Button>
          </Link>
        </div>
      </div>

      {/* Overall Score Hero */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-6xl font-bold">{data.overallScore}</div>
                <div className="text-lg text-muted-foreground">/ 100</div>
              </div>
              <div className="h-16 w-px bg-border hidden lg:block" />
              <div>
                <div className={`text-5xl font-bold ${getGradeColor(data.overallGrade)}`}>
                  {data.overallGrade}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
                  <span>·</span>
                  <span>Production Ready: {data.productionReadiness}%</span>
                  <span>·</span>
                  <span>Hackathon Ready: {data.hackathonReadiness}%</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-destructive">{data.criticalCount}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{data.highCount}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.recommendationsCount}</div>
                <div className="text-xs text-muted-foreground">Total Issues</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Score Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.moduleScores.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link key={mod.name} href={`/evaluation#${mod.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{mod.name}</span>
                        </div>
                        <span className={`text-lg font-bold ${getGradeColor(mod.grade)}`}>
                          {mod.grade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getScoreColor(mod.score)}`}
                            style={{ width: `${mod.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{mod.score}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Repository Info + Tech Debt */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Repository Summary */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Repository Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Language</span>
                    <p className="font-medium">{data.repository.language}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Framework</span>
                    <p className="font-medium">{data.repository.framework}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Architecture</span>
                    <p className="font-medium">{data.repository.architecture}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Files</span>
                    <p className="font-medium">{data.repository.files.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Debt + Readiness */}
            <Card>
              <CardHeader><CardTitle className="text-base">Health Indicators</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Technical Debt</span>
                    <span className={data.techDebt > 50 ? "text-destructive" : "text-emerald-500"}>
                      {data.techDebt}%
                    </span>
                  </div>
                  <Progress value={data.techDebt} indicatorClassName={data.techDebt > 50 ? "bg-red-500" : "bg-emerald-500"} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Production Readiness</span>
                    <span className={data.productionReadiness >= 70 ? "text-emerald-500" : "text-amber-500"}>
                      {data.productionReadiness}%
                    </span>
                  </div>
                  <Progress value={data.productionReadiness} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hackathon Readiness</span>
                    <span className={data.hackathonReadiness >= 70 ? "text-emerald-500" : "text-amber-500"}>
                      {data.hackathonReadiness}%
                    </span>
                  </div>
                  <Progress value={data.hackathonReadiness} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Scores Tab ──────────────────────────────── */}
        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">All Module Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...data.moduleScores].sort((a, b) => b.score - a.score).map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.name} className="flex items-center gap-4">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm w-32 shrink-0">{mod.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreColor(mod.score)}`}
                          style={{ width: `${mod.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-8 text-right ${getGradeColor(mod.grade)}`}>
                        {mod.grade}
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{mod.score}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Health Tab ──────────────────────────────── */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Security Health</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">72</div>
                <p className="text-sm text-muted-foreground">Moderate · 3 high-severity findings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Test Coverage</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">65</div>
                <p className="text-sm text-muted-foreground">Below average · coverage gaps detected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Accessibility Score</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">70</div>
                <p className="text-sm text-muted-foreground">WCAG 2.2 AA compliance in progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Dependency Health</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-500">85</div>
                <p className="text-sm text-muted-foreground">3 outdated packages</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Activity Tab ────────────────────────────── */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{item.action}</span>
                    <span className="text-muted-foreground ml-auto">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
