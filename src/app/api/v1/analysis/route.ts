import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  return apiSuccess({
    message: "Analysis API",
    _placeholder: "Will be implemented in Prompt 2 — Repository Ingestion & Source Management",
  });
}
