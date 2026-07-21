# Security Guidelines

## Authentication & Authorization

- Use Supabase Auth for all authentication
- Protect API routes with session validation
- Never trust client-side data — validate on the server
- Use Row-Level Security (RLS) in Supabase

## Data Protection

- All secrets in environment variables, never in code
- No logging of sensitive data (passwords, tokens, API keys)
- Encrypt sensitive data at rest
- Auto-delete temporary files within 24 hours

## API Security

- Use HTTPS only (enforced by Vercel)
- Rate limit API endpoints
- Validate all inputs with Zod
- Return generic error messages (don't leak implementation details)
- Set secure HTTP headers (CSP, HSTS, etc.)

## File Uploads

- Scan files for malware before extraction
- Enforce strict size limits
- No execution of uploaded files
- Sandbox extraction directories

## Dependency Security

- Pin dependency versions
- Run `npm audit` regularly
- Use Dependabot for automated security updates
- Review dependency licenses
