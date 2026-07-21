export { updateSession as default } from "@/lib/auth/middleware";

export const config = {
  matcher: [
    // Match only dashboard and auth routes (not static files, API, etc.)
    "/dashboard/:path*",
    "/repositories/:path*",
    "/analysis/:path*",
    "/evaluation/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
