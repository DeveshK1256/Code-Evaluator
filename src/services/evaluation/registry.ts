import { BaseEvaluationModule } from "./base-module";

const moduleRegistry = new Map<string, BaseEvaluationModule>();

export function registerEvaluationModule(module: BaseEvaluationModule): void {
  if (moduleRegistry.has(module.moduleId)) {
    throw new Error(`Module '${module.moduleId}' is already registered.`);
  }
  moduleRegistry.set(module.moduleId, module);
}

export function getEvaluationModule(id: string): BaseEvaluationModule | undefined {
  return moduleRegistry.get(id);
}

export function getAllEvaluationModules(): BaseEvaluationModule[] {
  return Array.from(moduleRegistry.values());
}

export function getModuleIds(): string[] {
  return Array.from(moduleRegistry.keys());
}
