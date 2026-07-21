# Architecture Guide

## Overview

Code Evaluator follows a hybrid event-driven + layered architecture.

```
┌─────────────────────┐
│   Next.js App       │  Pages, Components, API Routes
│   (RSC + Client)    │
├─────────────────────┤
│   Services          │  Business logic, orchestrations
├─────────────────────┤
│   Inngest           │  Background job pipeline
├─────────────────────┤
│   Supabase          │  PostgreSQL, Auth, Realtime
├─────────────────────┤
│   Gemini AI         │  Analysis engine
└─────────────────────┘
```

## Key Patterns

- **Plugin Pattern** — Evaluation modules register themselves
- **Repository Pattern** — Data access is abstracted
- **Server Components** — Default in Next.js 15 App Router
- **Streaming SSR** — Progressive page loading

## Module Registration

New modules are added without modifying core code:

```typescript
// 1. Create module in src/modules/your-module/
// 2. Implement the abstract base class
// 3. Register in config/modules.ts
registerModule(new YourModule());
```

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for more details.
