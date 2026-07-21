# Contributing

## Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes using conventional commits
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `perf:` — Performance improvements
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks
- `ci:` — CI/CD changes

## Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Components follow shadcn/ui patterns
- Each component has loading, error, and empty states
- Accessibility: WCAG 2.2 AA
- All new code must have tests
- API routes use the standardized error handling

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all checks pass (lint, typecheck, test, build)
4. Request review from maintainers
