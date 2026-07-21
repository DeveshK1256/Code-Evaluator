# Testing Guidelines

## Test Pyramid

```
        /\
       /E2E\           ← 5%: Critical user flows
      /------\
     /Integration\     ← 25%: API routes, service integrations
    /--------------\
   /   Unit Tests    \  ← 70%: Utilities, hooks, components
  /--------------------\
```

## Unit Tests (Vitest + Testing Library)

- Test utility functions for edge cases
- Test component rendering and user interactions
- Mock external dependencies (API calls, auth)
- Test loading, error, and empty states
- Test accessibility (keyboard nav, ARIA)

## Integration Tests

- Test API routes with request/response validation
- Test service layer with mocked dependencies
- Test database queries and mutations
- Test auth flows (sign in, sign out, protected routes)

## E2E Tests (Playwright)

- Critical user flows (sign up → analyze → view results)
- Auth flows (login, logout, password reset)
- Error states (invalid URL, network failure)
- Accessibility scan with axe-core

## Running Tests

```bash
pnpm test          # Watch mode
pnpm test:run      # Single run
pnpm test:coverage # With coverage report
pnpm test:e2e      # E2E tests
pnpm test:a11y     # Accessibility tests
```
