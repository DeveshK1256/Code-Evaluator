import { BaseAgent } from "./base-agent";

const agentRegistry = new Map<string, BaseAgent>();

export function registerAgent(agent: BaseAgent): void {
  if (agentRegistry.has(agent.config.name)) {
    throw new Error(`Agent '${agent.config.name}' is already registered.`);
  }
  agentRegistry.set(agent.config.name, agent);
}

export function getAgent(name: string): BaseAgent | undefined {
  return agentRegistry.get(name);
}

export function getAllAgents(): BaseAgent[] {
  return Array.from(agentRegistry.values());
}

export function getAgentNames(): string[] {
  return Array.from(agentRegistry.keys());
}
