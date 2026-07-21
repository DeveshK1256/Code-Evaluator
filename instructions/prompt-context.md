# Prompt Context for AI Coding Agents

## Project Overview

Code Evaluator is an AI-powered software evaluation platform that performs deep semantic analysis of software projects. It uses Gemini as the AI reasoning engine.

## Current Phase

**Phase 1: Foundation** — Complete

The project foundation is established with:
- Next.js 15 + React 19 + TypeScript (strict)
- Tailwind CSS + shadcn/ui design system
- Supabase Auth (email/password)
- Zustand + TanStack Query for state
- Inngest configured (no jobs yet)
- Gemini SDK installed (no analysis yet)
- Testing infrastructure (Vitest + Playwright)
- Documentation and developer tooling

## Key Facts

- Package manager: **pnpm**
- ESLint config: `next/core-web-vitals`
- No `@typescript-eslint` plugin — use built-in rules
- Components use `cn()` utility for class merging
- API routes use standardized `apiSuccess`/`apiError` helpers
- Error classes: `AppError`, `ValidationError`, `NotFoundError`, etc.
- Dark mode via CSS variables + Tailwind `dark:` prefix

## Next Phase

**Prompt 2: Repository Ingestion & Source Management**
- GitHub URL analysis
- ZIP parsing
- Repository storage
- Tech detection
- Knowledge graph building

## Files to Reference

- `PROMPT_0_ARCHITECTURE.md` — Full product specification
- `src/lib/utils/errors.ts` — Error handling patterns
- `src/lib/api/response.ts` — API response patterns
- `src/lib/utils/cn.ts` — className utility
- `src/types/api.ts` — TypeScript types
