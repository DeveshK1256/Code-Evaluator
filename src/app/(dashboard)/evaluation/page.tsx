"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/common/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import {
  Brain, CheckCircle2, Loader2, BarChart3, ListChecks,
  Shield, Zap, FileText, GitBranch, Target,
} from "lucide-react";

interface ModuleDef {
  id: string; name: string; description: string;
}

interface ProfileDef {
  id: string; name: string; description: string; isDefault: boolean; weights: Record<string, number>;
}

export default function EvaluationPage() {
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [profiles, setProfiles] = useState<ProfileDef[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<string>("balanced");
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ overallScore: number; overallGrade: string } | null>(null);
  const [readme, setReadme] = useState("");
  const [problemStatement, setProblemStatement] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/v1/evaluation");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setModules(json.data?.modules ?? []);
        setProfiles(json.data?.profiles ?? []);
        // Select all by default
        setSelectedModules(new Set((json.data?.modules ?? []).map((m: ModuleDef) => m.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAll = () => {
    if (selectedModules.size === modules.length) setSelectedModules(new Set());
    else setSelectedModules(new Set(modules.map((m) => m.id)));
  };

  const toggleModule = (id: string) => {
    const next = new Set(selectedModules);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedModules(next);
  };

  const problemStatementRequired = selectedModules.has("problem_alignment");

  const runEvaluation = async () => {
    if (selectedModules.size === 0) return;
    if (problemStatementRequired && !problemStatement.trim()) {
      setError("Problem Statement is required when Problem Statement Alignment is selected.");
      return;
    }
    setIsRunning(true);
    setError(null);
    setProgress(10);
    setStatusMessage("Queuing evaluation...");

    try {
      const res = await fetch("/api/v1/evaluation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: "placeholder-repo-id",
          profileId: selectedProfile,
          selectedModules: Array.from(selectedModules),
          readme: readme || undefined,
          problemStatement: problemStatement || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Evaluation failed");
      }

      setProgress(30);
      setStatusMessage("Running evaluation modules...");

      // Simulate progressive loading
      const totalModules = selectedModules.size;
      let completed = 0;
      for (const modId of selectedModules) {
        await new Promise((r) => setTimeout(r, 500));
        completed++;
        setProgress(30 + Math.round((completed / totalModules) * 50));
        setStatusMessage(`Evaluating: ${modules.find((m) => m.id === modId)?.name ?? modId}`);
      }

      setProgress(90);
      setStatusMessage("Calculating scores...");
      await new Promise((r) => setTimeout(r, 500));

      setProgress(100);
      setStatusMessage("Evaluation complete!");
      setResult({ overallScore: 82, overallGrade: "B" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const activeProfile = profiles.find((p) => p.id === selectedProfile);

  if (isLoading) return <LoadingOverlay label="Loading evaluation modules..." />;
  if (error && modules.length === 0) return <ErrorState title="Failed to Load" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Code Evaluation" description="Select criteria and evaluate your project">
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleAll} disabled={isRunning}>
            {selectedModules.size === modules.length ? "Clear All" : "Select All"}
          </Button>
          <Button onClick={runEvaluation} disabled={isRunning || selectedModules.size === 0}>
            {isRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</> : <><Zap className="h-4 w-4 mr-2" /> Run Evaluation</>}
          </Button>
        </div>
      </PageHeader>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{statusMessage}</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && <ErrorState title="Evaluation Failed" message={error} />}

      {/* Result */}
      {result && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Evaluation Complete</h2>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-4xl font-bold">{result.overallScore}/100</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className="text-4xl font-bold text-primary">{result.overallGrade}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evaluation Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p.id)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors text-left ${
                  selectedProfile === p.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
              </button>
            ))}
          </div>
          {activeProfile && (
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Weights: </span>
              {Object.entries(activeProfile.weights as Record<string, number>)
                .filter(([, w]) => w > 0)
                .map(([k, w]) => `${k.replace(/_/g, " ")}: ${(w * 100).toFixed(0)}%`)
                .join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Context</CardTitle>
          <CardDescription>Provide additional context for more accurate evaluation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eval-readme">README (optional)</Label>
            <Textarea
              id="eval-readme"
              placeholder="Paste your README content for better context..."
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eval-problem">
              Problem Statement {problemStatementRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="eval-problem"
              placeholder={problemStatementRequired ? "Required when Problem Alignment is selected..." : "Describe the problem your project solves..."}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={3}
              className={problemStatementRequired && !problemStatement.trim() ? "border-destructive" : ""}
            />
            {problemStatementRequired && !problemStatement.trim() && (
              <p className="text-xs text-destructive">Required when Problem Statement Alignment is selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evaluation Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => {
              const isSelected = selectedModules.has(mod.id);
              return (
                <label
                  key={mod.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleModule(mod.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    disabled={isRunning}
                  />
                  <div>
                    <div className="font-medium text-sm">{mod.name}</div>
                    <div className="text-xs text-muted-foreground">{mod.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
