import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils/cn";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Code Evaluator — AI-Powered Software Evaluation",
    template: "%s | Code Evaluator",
  },
  description: "Deep semantic analysis of software projects powered by Gemini AI.",
  keywords: ["code review", "AI evaluation", "software analysis", "Gemini"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
