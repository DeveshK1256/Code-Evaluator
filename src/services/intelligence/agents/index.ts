import { registerAgent } from "@/services/intelligence/registry";
import { SummaryAgent } from "./summary-agent";
import { ArchitectureAgent } from "./architecture-agent";
import { FeaturesAgent } from "./features-agent";
import { SecurityAgent } from "./security-agent";
import { DocumentationAgent } from "./documentation-agent";
import { ProblemStatementAgent } from "./problem-statement-agent";

export function registerAllAgents(): void {
  registerAgent(new SummaryAgent());
  registerAgent(new ArchitectureAgent());
  registerAgent(new FeaturesAgent());
  registerAgent(new SecurityAgent());
  registerAgent(new DocumentationAgent());
  registerAgent(new ProblemStatementAgent());
}

export {
  SummaryAgent,
  ArchitectureAgent,
  FeaturesAgent,
  SecurityAgent,
  DocumentationAgent,
  ProblemStatementAgent,
};
