import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils/cn";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Code Evaluator — AI-Powered Software Evaluation Platform",
    template: "%s | Code Evaluator",
  },
  description: "Get expert AI-powered code reviews with deep semantic analysis. Evaluate code quality, security, testing, accessibility, and problem alignment with detailed scores and actionable recommendations.",
  keywords: [
    "code review", "AI evaluation", "software analysis", "code quality",
    "security audit", "code grader", "GitHub repo analyzer", "code scoring",
    "software assessment", "code review tool", "AI code reviewer",
  ],
  authors: [{ name: "Code Evaluator" }],
  creator: "Code Evaluator",
  publisher: "Code Evaluator",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://code-evaluator-sigma.vercel.app",
    siteName: "Code Evaluator",
    title: "Code Evaluator — AI-Powered Software Evaluation Platform",
    description: "Deep semantic analysis of software projects. Get expert-level code reviews powered by AI with explainable scores and actionable recommendations.",
    images: [{ url: "/favicon.svg", width: 32, height: 32, alt: "Code Evaluator" }],
  },
  twitter: {
    card: "summary",
    title: "Code Evaluator",
    description: "AI-Powered Software Evaluation Platform",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#09090b" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <Providers>
          {children}
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
