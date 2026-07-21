import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { AiCopilot } from "@/components/evaluation/ai-copilot";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-60 transition-all duration-300">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
      <Footer />
      <AiCopilot />
    </div>
  );
}
