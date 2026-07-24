import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAllEvaluationModules } from "@/services/evaluation/registry";
import { registerAllEvaluationModules } from "@/services/evaluation/modules";
import { EVALUATION_PROFILES } from "@/config/evaluation-profiles";

export async function GET() {
  try {
    // Ensure modules are registered
    registerAllEvaluationModules();

    const modules = getAllEvaluationModules().map((m) => ({
      id: m.moduleId,
      name: m.moduleName,
      description: m.description,
      version: m.version,
    }));

    const profiles = EVALUATION_PROFILES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      weights: p.weights,
    }));

    return apiSuccess({ modules, profiles });
  } catch (error) {
    return apiError(error);
  }
}
