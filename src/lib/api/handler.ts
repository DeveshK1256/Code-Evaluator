import { NextRequest } from "next/server";
import { apiError } from "./response";
import { logger } from "@/lib/logger";

type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<T>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      logger.error("API Error", {
        error: error instanceof Error ? error.message : String(error),
        path: request.nextUrl.pathname,
        method: request.method,
      });
      return apiError(error);
    }
  };
}
