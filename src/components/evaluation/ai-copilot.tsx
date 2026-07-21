"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Brain, Send, Sparkles, MessageSquare, X,
  ChevronDown, ChevronUp, Lightbulb, Copy, Check,
  Loader2, BarChart3, Shield, Github, Target,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Why did Security score only 72?",
  "Show me all findings related to authentication.",
  "Which three fixes will improve my score the most?",
  "Explain this recommendation in beginner-friendly terms.",
  "What would Google Solution Challenge judges focus on?",
  "Generate a sprint plan from the improvement roadmap.",
];

export function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I'm your AI Review Copilot. I can answer questions about your evaluation results, explain findings, and help you create improvement plans. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response — in production, this queries the intelligence model + evaluation results
    setTimeout(() => {
      const response = generateResponse(content);
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: new Date() }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSuggestedClick = (question: string) => {
    setInput(question);
    handleSend(question);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          aria-label="Open AI Review Copilot"
        >
          <Brain className="h-6 w-6" />
        </button>
      )}

      {/* Copilot Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-2xl flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Review Copilot</span>
              <Badge variant="success" className="text-[10px]">Powered by Intelligence</Badge>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-md transition-colors" aria-label="Close copilot">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === "assistant" && <Brain className="h-3 w-3" />}
                    <span className="text-[10px] opacity-70">
                      {msg.role === "assistant" ? "Copilot" : "You"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="mt-1 text-[10px] opacity-50 hover:opacity-100 transition-opacity"
                    aria-label="Copy message"
                  >
                    <Copy className="h-3 w-3 inline" /> Copy
                  </button>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing evaluation data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">
                <Lightbulb className="h-3 w-3 inline mr-1" />
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedClick(q)}
                    className="text-[11px] px-2 py-1 rounded-md bg-muted hover:bg-accent transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                placeholder="Ask about your evaluation..."
                className="flex-1 min-h-[36px] max-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={1}
                aria-label="Ask a question about your evaluation"
              />
              <Button size="icon" onClick={() => handleSend(input)} disabled={!input.trim() || isLoading} aria-label="Send question">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function generateResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("security") && q.includes("score")) {
    return "The Security module scored 72/100. Key factors:\n\n• **Authentication** implementation is solid (JWT-based, session management present)\n• **Input validation** gaps detected on 3 API routes\n• **Security headers** not fully configured (missing CSP)\n• **Rate limiting** not implemented\n• **Dependency vulnerabilities** in 2 packages\n\nTop recommendation: Add Zod validation to all API routes first — it addresses the highest risk and improves your score by an estimated 12 points.";
  }

  if (q.includes("authentication") || q.includes("auth")) {
    return "**Authentication-Related Findings:**\n\n1. ✓ JWT-based authentication implemented\n2. ✓ Session management configured\n3. ⚠️ No password reset rate limiting\n4. ⚠️ Missing account lockout after failed attempts\n5. ℹ️ OAuth provider (Google) integration found\n\nAll auth-related files are in the `src/features/auth/` directory. The implementation follows standard practices but could benefit from additional security hardening.";
  }

  if (q.includes("improve") || q.includes("fix") || q.includes("top")) {
    return "**Top 3 Improvements for Maximum Score Impact:**\n\n1️⃣ **Add Input Validation** (+12 pts)\n   Add Zod schemas to all API routes\n   Effort: Hours · Module: Security\n\n2️⃣ **Increase Test Coverage** (+15 pts)\n   Add unit tests for core services\n   Effort: Days · Module: Testing\n\n3️⃣ **Configure CSP Headers** (+8 pts)\n   Add Content Security Policy\n   Effort: Hours · Module: Security\n\nImplementing all three would boost your overall score from 82 to approximately 93.";
  }

  if (q.includes("google solution challenge") || q.includes("judge")) {
    return "Under the **Google Solution Challenge** rubric, your project would be evaluated with different weights:\n\n• Problem Statement Alignment: 25% (current: 90 → weighted: +22.5)\n• Google Services: 20% (current: 88 → weighted: +17.6)\n• Code Quality: 10% (current: 78 → weighted: +7.8)\n• Testing: 10% (current: 65 → weighted: +6.5)\n\n**Estimated GSC Score: 84** (vs. balanced score of 82)\n\nKey advice: Strong Google Services integration helps. Focus on improving Testing coverage for the biggest GSC score boost.";
  }

  if (q.includes("sprint") || q.includes("plan") || q.includes("roadmap")) {
    return "**Improvement Sprint Plan:**\n\n**Week 1: Security Hardening (Immediate)**\n• Add input validation to all routes\n• Configure security headers\n• Implement rate limiting\n\n**Week 2: Quality & Testing (Next Sprint)**\n• Add unit tests for core services\n• Set up CI/CD pipeline\n• Improve accessibility contrast\n\n**Week 3: Polish (Future)**\n• Add error boundaries\n• Set performance budget\n• Review dependency health\n\nEstimated total effort: 5-7 days · Projected score improvement: +15-18 points";
  }

  return "I can help you understand your evaluation results in detail. Try asking:\n\n• Why did a specific module score what it did?\n• Show me all findings for a category\n• What improvements will have the biggest impact?\n• How would this score under a different rubric?\n• Generate an improvement plan";
}
