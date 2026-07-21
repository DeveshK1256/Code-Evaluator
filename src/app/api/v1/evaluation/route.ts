import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAllEvaluationModules } from "@/services/evaluation/registry";
import { EVALUATION_PROFILES } from "@/config/evaluation-profiles";

export async function GET() {
  try {
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
