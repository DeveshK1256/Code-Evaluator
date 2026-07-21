/**
 * Security Headers Configuration
 *
 * Content Security Policy and security-related headers.
 * These are applied via next.config.ts headers function.
 */

export const CSP_HEADER = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://*.github.com https://*.supabase.co`,
  `font-src 'self'`,
  `connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

export const SECURE_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;
