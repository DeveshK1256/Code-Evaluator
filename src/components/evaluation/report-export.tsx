"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download, FileText, FileJson, FileType, Table, FileCode,
} from "lucide-react";

export function ReportExport() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(format);

    // In production, these call the API to generate and download the report
    await new Promise((r) => setTimeout(r, 1000));

    const filename = `evaluation-report.${format}`;
    const content = generateSampleContent(format);
    const blob = new Blob([content], { type: getMimeType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setExporting(null);
  };

  const getMimeType = (format: string): string => {
    switch (format) {
      case "pdf": return "application/pdf";
      case "md": return "text/markdown";
      case "html": return "text/html";
      case "json": return "application/json";
      case "csv": return "text/csv";
      default: return "text/plain";
    }
  };

  const formats = [
    { id: "pdf", label: "PDF Report", icon: FileText, description: "Professional printable report" },
    { id: "md", label: "Markdown", icon: FileCode, description: "Documentation-friendly format" },
    { id: "html", label: "HTML", icon: FileType, description: "Interactive web report" },
    { id: "json", label: "JSON", icon: FileJson, description: "Raw evaluation data" },
    { id: "csv", label: "CSV", icon: Table, description: "Spreadsheet-compatible data" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Report</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((fmt) => {
          const Icon = fmt.icon;
          return (
            <DropdownMenuItem
              key={fmt.id}
              onClick={() => handleExport(fmt.id)}
              disabled={exporting === fmt.id}
              className="flex items-center gap-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{fmt.label}</p>
                <p className="text-xs text-muted-foreground">{fmt.description}</p>
              </div>
              {exporting === fmt.id && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function generateSampleContent(format: string): string {
  switch (format) {
    case "md":
      return `# Code Evaluation Report

## Overall Score: 82/100 (B)
**Confidence:** 84%

### Module Scores
| Module | Score | Grade | Confidence |
|--------|-------|-------|------------|
| Code Quality | 78 | B+ | 85% |
| Security | 72 | B | 82% |
| Performance | 85 | A- | 88% |
| Testing | 65 | C+ | 75% |
| Problem Alignment | 90 | A- | 92% |

### Top Recommendations
1. **Implement Input Validation** (+12 pts) - Security - Hours
2. **Add Unit Tests** (+15 pts) - Testing - Days
3. **Configure CSP Headers** (+8 pts) - Security - Hours

### Architecture
**Pattern:** Feature-based
**Language:** TypeScript
**Framework:** Next.js 15
`;
    case "json":
      return JSON.stringify({
        reportVersion: "1.0",
        generatedAt: new Date().toISOString(),
        overallScore: 82,
        overallGrade: "B",
        modules: [
          { name: "Code Quality", score: 78, grade: "B+", confidence: 0.85 },
          { name: "Security", score: 72, grade: "B", confidence: 0.82 },
        ],
        recommendations: [
          { title: "Implement Input Validation", impact: 12, effort: "hours" },
        ],
      }, null, 2);
    case "csv":
      return "Module,Score,Grade,Confidence\nCode Quality,78,B+,0.85\nSecurity,72,B,0.82\nPerformance,85,A-,0.88";
    case "html":
      return `<!DOCTYPE html><html><head><title>Evaluation Report</title><style>body{font-family:system-ui;max-width:800px;margin:auto;padding:2rem}</style></head><body><h1>Code Evaluation Report</h1><p>Overall Score: <strong>82/100 (B)</strong></p><table border="1"><tr><th>Module</th><th>Score</th><th>Grade</th></tr><tr><td>Code Quality</td><td>78</td><td>B+</td></tr></table></body></html>`;
    default:
      return "Evaluation Report";
  }
}
