# Deployment Guide

## Architecture Overview

```
Vercel (Edge Network)
  ├── Static Assets (CDN)
  ├── Serverless Functions (Node.js 20)
  │   ├── API Routes (/api/v1/*)
  │   ├── SSR Pages
  │   └── Middleware
  └── Background Jobs (Inngest)

Supabase (Managed)
  ├── PostgreSQL 16
  ├── Auth (Email/Password + OAuth)
  ├── Row-Level Security
  └── Realtime (optional)

Google AI
  └── Gemini 2.5 Pro

Vercel Blob (File Storage)
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Vercel account
- Supabase project
- Gemini API key
- Inngest account (optional for background jobs)

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=

# Optional
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
INNGEST_APP_ID=code-evaluator
VERCEL_BLOB_TOKEN=
GITHUB_TOKEN=  # For higher GitHub API rate limits
LOG_LEVEL=info
```

## Deployment Steps

### 1. Database Setup

Run the SQL migrations in order:
1. `src/lib/db/schema.ts` — Core tables (repositories, files, uploads)
2. `src/lib/db/intelligence-schema.ts` — Intelligence tables
3. `src/lib/db/evaluation-schema.ts` — Evaluation tables

```bash
# Using Supabase CLI
supabase db push

# Or run manually in Supabase SQL editor
```

### 2. Vercel Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### 3. Verify Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/v1/health

# Should return:
# { "status": "healthy", "version": "1.0.0", ... }
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS enabled (automatic with Vercel)
- [ ] Custom domain configured
- [ ] Background jobs configured (Inngest)
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Rate limiting active
- [ ] Security headers verified
- [ ] Backup strategy in place

## Monitoring & Observability

- **Health Endpoint**: `GET /api/v1/health`
- **Structured Logging**: JSON logs with request IDs
- **Error Tracking**: Vercel Analytics + Sentry (recommended)
- **Performance**: Vercel Analytics (Core Web Vitals)
- **AI Metrics**: Token usage, latency, cost tracking

## Rollback Strategy

```bash
# Vercel instant rollback
vercel rollback --prod

# Database rollback (if needed)
supabase db restore --target-time "2024-01-01 00:00:00"
```

## Backup Strategy

- **Database**: Supabase automated backups (daily)
- **File Storage**: Vercel Blob (no automatic backup — export critical data)
- **Configuration**: Environment variables stored in Vercel dashboard
