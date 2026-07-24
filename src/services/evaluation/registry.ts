import { BaseEvaluationModule } from "./base-module";

const moduleRegistry = new Map<string, BaseEvaluationModule>();

let _registered = false;

export function registerEvaluationModule(module: BaseEvaluationModule): void {
  if (_registered) return;
  if (moduleRegistry.has(module.moduleId)) {
    return; // Already registered, skip silently
  }
  moduleRegistry.set(module.moduleId, module);
}

export function markModulesRegistered(): void {
  _registered = true;
}

export function areModulesRegistered(): boolean {
  return _registered;
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
