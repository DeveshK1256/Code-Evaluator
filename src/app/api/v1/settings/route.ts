import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  return apiSuccess({
    message: "Settings API",
    _placeholder: "Will be implemented in future prompts",
  });
}
