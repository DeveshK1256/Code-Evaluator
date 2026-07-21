import { apiSuccess, apiError } from "@/lib/api/response";
import { EVALUATION_PROFILES } from "@/config/evaluation-profiles";

export async function GET() {
  try {
    const profiles = EVALUATION_PROFILES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      weights: p.weights,
      isDefault: p.isDefault,
    }));

    return apiSuccess(profiles);
  } catch (error) {
    return apiError(error);
  }
}
