"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; email?: string; password?: string }>({});

  // Client-side validation before form submission
  const validate = (displayName: string, email: string, password: string): boolean => {
    const errors: { displayName?: string; email?: string; password?: string } = {};
    if (!displayName || displayName.trim().length < 2) errors.displayName = "Display name must be at least 2 characters";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Valid email is required";
    if (!password || password.length < 6) errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const displayName = (formData.get("displayName") as string).trim();
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    if (!validate(displayName, email, password)) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Registration failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-2">
            <Code className="h-6 w-6 text-primary" />
            <span>Code Evaluator</span>
          </Link>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Get started with AI-powered code evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName" name="displayName" placeholder="Your name"
                disabled={isLoading} required autoComplete="name"
                aria-invalid={!!fieldErrors.displayName}
                aria-describedby={fieldErrors.displayName ? "displayName-error" : undefined}
                onChange={() => fieldErrors.displayName && setFieldErrors((p) => ({ ...p, displayName: undefined }))}
              />
              {fieldErrors.displayName && <p id="displayName-error" className="text-xs text-destructive" role="alert">{fieldErrors.displayName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" name="email" type="email" placeholder="you@example.com"
                required disabled={isLoading} autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                onChange={() => fieldErrors.email && setFieldErrors((p) => ({ ...p, email: undefined }))}
              />
              {fieldErrors.email && <p id="email-error" className="text-xs text-destructive" role="alert">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" name="password" type="password" placeholder="Min. 6 characters"
                required disabled={isLoading} autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                onChange={() => fieldErrors.password && setFieldErrors((p) => ({ ...p, password: undefined }))}
              />
              {fieldErrors.password && <p id="password-error" className="text-xs text-destructive" role="alert">{fieldErrors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
