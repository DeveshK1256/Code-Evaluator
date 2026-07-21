import Link from "next/link";
import { ArrowRight, Code, Shield, Zap, BarChart3, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Code className="h-6 w-6 text-primary" />
            <span>Code Evaluator</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="flex-1">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered{" "}
            <span className="text-primary">Software Evaluation</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Deep semantic analysis of your software projects. Get expert-level code reviews
            powered by Gemini AI — with explainable scores and actionable recommendations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">
                Start Evaluating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-6">
              <Code className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Deep Code Understanding</h3>
              <p className="text-muted-foreground">
                Understands architecture, business logic, design patterns, and intent.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Security Review</h3>
              <p className="text-muted-foreground">
                Identifies vulnerabilities, auth issues, and security misconfigurations.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Performance Analysis</h3>
              <p className="text-muted-foreground">
                Detects N+1 queries, bundle issues, and optimization opportunities.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <BarChart3 className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Problem Alignment</h3>
              <p className="text-muted-foreground">
                Measures implementation against uploaded requirements.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <Github className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">GitHub Integration</h3>
              <p className="text-muted-foreground">
                Analyze any public repository with a single URL.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <svg className="h-10 w-10 text-primary mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h3 className="font-semibold text-lg mb-2">Export Reports</h3>
              <p className="text-muted-foreground">
                Export as PDF, Markdown, JSON, or CSV. Share with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Code Evaluator — AI-Powered Software Evaluation Platform</p>
        </div>
      </footer>
    </div>
  );
}
