"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText, AlertTriangle, CheckCircle2, Info,
  ChevronDown, ChevronRight, ExternalLink, Search,
} from "lucide-react";
import type { EvidenceItem, Finding } from "@/types/evaluation";

interface EvidenceViewerProps {
  findings: Finding[];
  title?: string;
}

export function EvidenceViewer({ findings, title = "Findings" }: EvidenceViewerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const toggleExpand = (title: string) => {
    const next = new Set(expanded);
    if (next.has(title)) next.delete(title); else next.add(title);
    setExpanded(next);
  };

  const filteredFindings = findings.filter((f) => {
    if (filter === "deterministic" && f.evidence.every((e) => e.type !== "deterministic")) return false;
    if (filter === "inferred" && f.evidence.every((e) => e.type !== "inferred")) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && !f.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "medium": return <Info className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-l-destructive";
      case "high": return "border-l-amber-500";
      case "medium": return "border-l-blue-500";
      default: return "border-l-muted";
    }
  };

  const evidenceType = (type: string) => {
    switch (type) {
      case "deterministic": return <Badge variant="success" className="text-[10px]">Fact</Badge>;
      case "inferred": return <Badge variant="warning" className="text-[10px]">AI Inference</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title} ({filteredFindings.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search findings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 rounded-md border border-input bg-background pl-7 pr-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Filter by evidence type"
            >
              <option value="all">All Evidence</option>
              <option value="deterministic">Facts Only</option>
              <option value="inferred">AI Inferences Only</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {search ? "No findings match your search." : "No findings available."}
          </div>
        ) : (
          filteredFindings.map((finding, index) => (
            <div
              key={index}
              className={`rounded-lg border-l-4 ${severityColor(finding.severity)} bg-card`}
            >
              <button
                onClick={() => toggleExpand(finding.title)}
                className="flex w-full items-start gap-3 p-3 text-left hover:bg-accent/50 rounded-r-lg transition-colors"
                aria-expanded={expanded.has(finding.title)}
              >
                {severityIcon(finding.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{finding.title}</span>
                    <Badge variant={
                      finding.severity === "critical" || finding.severity === "high" ? "destructive" : "secondary"
                    } className="text-[10px]">{finding.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{finding.description}</p>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {finding.category} · {finding.evidence.length} evidence item{finding.evidence.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {expanded.has(finding.title) ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              </button>

              {expanded.has(finding.title) && (
                <div className="px-3 pb-3 space-y-2 border-t pt-2">
                  {finding.evidence.map((ev, ei) => (
                    <div key={ei} className="rounded-md bg-muted/50 p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        {evidenceType(ev.type)}
                        <span className="text-muted-foreground capitalize">{ev.confidence} confidence</span>
                      </div>
                      <p>{ev.description}</p>
                      {ev.filePath && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <code className="text-[10px]">{ev.filePath}{ev.lineNumber ? `:${ev.lineNumber}` : ""}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
