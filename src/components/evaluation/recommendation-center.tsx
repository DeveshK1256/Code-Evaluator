"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  Clock, ArrowRight, FileText, Calendar,
} from "lucide-react";

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  effort: string;
  impact: number;
  module: string;
  files: string[];
  phase: "immediate" | "next_sprint" | "future";
  completed?: boolean;
}

const sampleRecommendations: RecommendationItem[] = [
  { id: "1", title: "Implement Input Validation on All API Routes", description: "Add Zod validation schemas to prevent injection attacks and improve data integrity.", severity: "critical", effort: "hours", impact: 12, module: "Security", files: ["src/app/api/"], phase: "immediate" },
  { id: "2", title: "Configure Content Security Policy", description: "Add CSP headers to prevent XSS attacks and control resource loading.", severity: "high", effort: "hours", impact: 8, module: "Security", files: ["next.config.ts"], phase: "immediate" },
  { id: "3", title: "Add Unit Tests for Core Services", description: "Increase test coverage for critical business logic and API routes.", severity: "high", effort: "days", impact: 15, module: "Testing", files: ["src/services/", "src/app/api/"], phase: "next_sprint" },
  { id: "4", title: "Improve Accessibility Contrast", description: "Update color palette to meet WCAG 2.2 AA contrast requirements.", severity: "medium", effort: "hours", impact: 6, module: "Accessibility", files: ["src/styles/"], phase: "next_sprint" },
  { id: "5", title: "Add Rate Limiting", description: "Protect API endpoints from abuse with rate limiting middleware.", severity: "high", effort: "hours", impact: 10, module: "Security", files: ["src/middleware.ts"], phase: "immediate" },
  { id: "6", title: "Implement Error Boundary Components", description: "Add React error boundaries to catch rendering errors gracefully.", severity: "medium", effort: "hours", impact: 5, module: "Code Quality", files: ["src/components/"], phase: "future" },
  { id: "7", title: "Set Up CI/CD Pipeline", description: "Configure automated testing and deployment pipeline.", severity: "medium", effort: "hours", impact: 8, module: "DevOps", files: [".github/workflows/"], phase: "next_sprint" },
  { id: "8", title: "Add Performance Budget", description: "Set up Lighthouse CI to track and enforce performance budgets.", severity: "low", effort: "hours", impact: 4, module: "Performance", files: ["package.json"], phase: "future" },
];

export function RecommendationCenter() {
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleCompleted = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompleted(next);
  };

  const phases = [
    { id: "immediate", label: "Immediate", count: sampleRecommendations.filter((r) => r.phase === "immediate").length, color: "text-destructive border-destructive" },
    { id: "next_sprint", label: "Next Sprint", count: sampleRecommendations.filter((r) => r.phase === "next_sprint").length, color: "text-amber-500 border-amber-500" },
    { id: "future", label: "Future", count: sampleRecommendations.filter((r) => r.phase === "future").length, color: "text-blue-500 border-blue-500" },
  ];

  const filtered = selectedPhase === "all"
    ? sampleRecommendations
    : sampleRecommendations.filter((r) => r.phase === selectedPhase);

  const totalImpact = sampleRecommendations.reduce((s, r) => s + r.impact, 0);
  const completedImpact = sampleRecommendations.filter((r) => completed.has(r.id)).reduce((s, r) => s + r.impact, 0);

  const severityIcon = (s: string) => {
    switch (s) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "high": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "medium": return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Impact Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Potential Score Improvement</span>
            <span className="text-2xl font-bold text-emerald-500">+{totalImpact}</span>
            <span className="text-muted-foreground">points</span>
            {completed.size > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-emerald-500">{completed.size} completed (+{completedImpact} pts)</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPhase("all")}
          className={`rounded-lg border px-4 py-2 text-sm transition-colors ${selectedPhase === "all" ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
        >
          All ({sampleRecommendations.length})
        </button>
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPhase(p.id)}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${selectedPhase === p.id ? p.color + " bg-opacity-5" : "hover:bg-accent"}`}
          >
            <span className="capitalize">{p.label}</span>
            <span className="ml-1 text-muted-foreground">({p.count})</span>
          </button>
        ))}
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No recommendations in this category.</div>
        ) : (
          filtered.map((rec) => (
            <Card key={rec.id} className={`border-l-4 ${completed.has(rec.id) ? "border-l-emerald-500 opacity-60" : rec.severity === "critical" ? "border-l-destructive" : rec.severity === "high" ? "border-l-amber-500" : "border-l-blue-500"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={completed.has(rec.id)}
                    onChange={() => toggleCompleted(rec.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    aria-label={`Mark "${rec.title}" as completed`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {severityIcon(rec.severity)}
                          <span className={`text-sm font-medium ${completed.has(rec.id) ? "line-through" : ""}`}>
                            {rec.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{rec.module}</Badge>
                      <Badge variant="outline" className="text-[10px]">Effort: {rec.effort}</Badge>
                      <Badge variant="success" className="text-[10px]">+{rec.impact} pts</Badge>
                      {rec.files.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {rec.files.length} file{rec.files.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
