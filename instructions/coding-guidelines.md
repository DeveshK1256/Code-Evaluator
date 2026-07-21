# Coding Guidelines

## General Principles

- Write readable, maintainable code
- Prefer small, focused functions and components
- Use descriptive names for variables, functions, and components
- Add comments only when the code's intent isn't obvious
- Follow the existing patterns in the codebase

## TypeScript

- Use strict mode (enabled in tsconfig)
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and mapped types
- Avoid `any` — use `unknown` if the type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use `const` assertions for literal types

## React/Next.js

- Use React Server Components by default
- Add `"use client"` only when needed (hooks, state, events)
- Use the App Router patterns (layout.tsx, loading.tsx, error.tsx)
- Use `Link` for navigation, not `<a>`
- Optimize images with `next/image`

## Components

- Each component in its own file
- Use named exports, not default exports
- Components should handle loading, error, and empty states
- Use TypeScript interfaces for props
- Use `cn()` utility for conditional classes

## API Routes

- Use versioned routes (`/api/v1/`)
- Use standardized response format (`apiSuccess`, `apiError`)
- Validate inputs with Zod
- Use `withErrorHandler` wrapper

## State Management

- Server state → TanStack Query
- UI state → Zustand (persisted to localStorage where needed)
- Form state → React Hook Form + Zod
