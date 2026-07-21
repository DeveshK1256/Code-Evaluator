import { type NextRequest, NextResponse } from "next/server";

/**
 * Simplified middleware for Vercel Edge.
 * Auth enforcement is handled by API routes and page components.
 */
export async function updateSession(_request: NextRequest) {
  // Static response — no external calls needed
  return NextResponse.next();
}
