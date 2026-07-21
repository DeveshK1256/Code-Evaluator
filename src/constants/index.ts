export const APP_NAME = "Code Evaluator";
export const APP_DESCRIPTION = "AI-Powered Software Evaluation & Intelligence Platform";
export const APP_VERSION = "1.0.0";

export const API_PREFIX = "/api/v1";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  REPOSITORIES: "/repositories",
  ANALYSIS: "/analysis",
  EVALUATION: "/evaluation",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

export const LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_UPLOAD_FILES: 10,
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
} as const;

export const THEME_STORAGE_KEY = "code-evaluator-theme";
export const SIDEBAR_STORAGE_KEY = "code-evaluator-sidebar";

export const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: "LayoutDashboard" },
  { href: ROUTES.REPOSITORIES, label: "Repositories", icon: "GitBranch" },
  { href: ROUTES.ANALYSIS, label: "Analysis", icon: "Search" },
  { href: ROUTES.EVALUATION, label: "Evaluation", icon: "BarChart3" },
  { href: ROUTES.REPORTS, label: "Reports", icon: "FileText" },
  { href: ROUTES.SETTINGS, label: "Settings", icon: "Settings" },
] as const;
