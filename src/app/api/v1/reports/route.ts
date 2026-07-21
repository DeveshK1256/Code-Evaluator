import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  return apiSuccess({
    message: "Reports API",
    _placeholder: "Will be implemented in Prompt 4 — Reports & Export",
  });
}
