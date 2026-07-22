import { NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { AppError } from "@/lib/utils/errors";
import { APP_VERSION } from "@/constants";

function createMeta(requestId?: string) {
  return {
    requestId: requestId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  };
}

export function apiSuccess<T>(data: T, status: number = 200, requestId?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  };
  return NextResponse.json(response, { status });
}

export function apiError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: createMeta(requestId ?? error.requestId),
    };
    return NextResponse.json(response, { status: error.statusCode });
  }

  if (error instanceof Error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message,
      },
      meta: createMeta(requestId),
    };
    return NextResponse.json(response, { status: 500 });
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: error != null ? String(error) : "An unexpected error occurred",
    },
    meta: createMeta(requestId),
  };
  return NextResponse.json(response, { status: 500 });
}

export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  },
  requestId?: string
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasMore: pagination.page < totalPages,
    },
    meta: createMeta(requestId),
  };
  return NextResponse.json(response);
}
