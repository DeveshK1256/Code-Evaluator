# Architecture Overview

## System Architecture

The Code Evaluator platform follows a **hybrid event-driven + layered architecture** on a serverless foundation.

### Layers

1. **Presentation Layer** — Next.js App Router (RSC + Client Components)
2. **API Layer** — Next.js Route Handlers (RESTful, versioned `/api/v1/`)
3. **Application Layer** — Inngest serverless functions (background jobs)
4. **Domain Layer** — Modular evaluation engines (plugin architecture)
5. **Infrastructure Layer** — Supabase (PostgreSQL), Gemini API, Vercel

### Key Principles

- **Separation of Concerns** — Each layer has a distinct responsibility
- **Dependency Inversion** — Domain modules depend on abstractions
- **Event-Driven Processing** — Long-running tasks never block HTTP
- **Immutable Artifacts** — Analysis results are append-only
- **Caching by Fingerprint** — Content hash determines cache key
- **Fail Isolation** — One module failing doesn't affect others

### Data Flow

```
User → Route Handler → Validation → Service → Database
                                           → Background Job (Inngest)
                                                → Gemini AI
                                                → Store Results
User ← API Response ← Poll/WebSocket ← Completion
```

### Module Architecture

Evaluation modules follow a plugin pattern:

```typescript
abstract class EvaluationModule {
  abstract id: string;
  abstract evaluate(context: ContextPackage): Promise<ModuleResult>;
}

// Register new modules without modifying core code
registerModule(new CustomModule());
```

See [Prompt 0](../PROMPT_0_ARCHITECTURE.md) for the full architectural specification.
