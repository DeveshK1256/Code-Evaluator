# Security Guide

## Security Architecture

### Authentication & Authorization
- **Provider**: Supabase Auth (email/password)
- **Password Requirements**: Minimum 6 characters
- **Session Management**: HTTP-only cookies, SameSite=Lax
- **Row-Level Security**: All database tables have RLS policies
- **Protected Routes**: Middleware checks for authenticated sessions

### API Security
- **Rate Limiting**: In-memory rate limiter (100 req/min default)
- **Input Validation**: Zod schemas on all API endpoints
- **Error Responses**: Generic error messages (no stack traces)
- **CORS**: Restricted to application origin

### Data Protection
- **Secrets Management**: All secrets in environment variables
- **Encryption**: TLS 1.3 for all communications
- **File Uploads**: Size limits, type validation, Zip Slip prevention
- **Sensitive Data**: Redacted before AI processing

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000
- Permissions-Policy: restricted defaults

## Threat Model

| Threat | Mitigation | Priority |
|---|---|---|
| Malicious file upload | Size/type validation, Zip Slip prevention | Critical |
| Code injection | No execution of user code | Critical |
| API key exposure | Server-side only, env vars | Critical |
| Unauthorized access | RLS policies, auth checks | High |
| SSRF via GitHub clone | Sandboxed execution | High |
| Mass evaluation (DoS) | Rate limiting, concurrency caps | High |
| AI hallucination | Evidence requirements, confidence scores | Medium |
| Dependency vulnerability | Regular audits, lockfile | Medium |

## OWASP Top 10 Coverage

| OWASP Risk | Status |
|---|---|
| A01: Broken Access Control | ✅ RLS + Middleware |
| A02: Cryptographic Failures | ✅ TLS 1.3 |
| A03: Injection | ✅ Zod validation |
| A04: Insecure Design | ✅ Architecture review |
| A05: Security Misconfiguration | ✅ Security headers |
| A06: Vulnerable Components | ✅ Dependency audit |
| A07: Auth Failures | ✅ Supabase Auth |
| A08: Data Integrity Failures | ✅ Input validation |
| A09: Logging Failures | ✅ Structured logging |
| A10: SSRF | ✅ Sandboxed execution |
