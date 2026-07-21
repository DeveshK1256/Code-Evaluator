# Folder Structure Guide

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-route group (no sidebar)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Dashboard-route group (with sidebar)
│   │   ├── dashboard/
│   │   ├── repositories/
│   │   ├── analysis/
│   │   ├── evaluation/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── profile/
│   ├── api/v1/                   # Versioned API routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── repositories/         # Repository management
│   │   ├── analysis/             # Analysis pipeline
│   │   ├── evaluation/           # Evaluation results
│   │   ├── reports/              # Report generation
│   │   ├── settings/             # User settings
│   │   └── health/               # Health check
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── loading.tsx               # Global loading
│   ├── error.tsx                 # Global error
│   └── not-found.tsx             # 404 page
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── common/                   # Shared components
│   │   ├── page-header.tsx
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   ├── loading-overlay.tsx
│   │   ├── spinner.tsx
│   │   ├── breadcrumb.tsx
│   │   └── search-input.tsx
│   └── layout/                   # Layout components
│       ├── app-shell.tsx
│       ├── sidebar.tsx
│       ├── navbar.tsx
│       └── footer.tsx
│
├── features/                     # Feature modules
│   └── auth/
│       ├── components/
│       └── hooks/
│
├── hooks/                        # Shared React hooks
├── lib/                          # Core libraries
│   ├── api/                      # API response helpers
│   ├── auth/                     # Auth clients
│   ├── db/                       # Database types
│   ├── gemini/                   # Gemini AI (configured)
│   ├── logger/                   # Structured logging
│   ├── security/                 # Security utilities
│   └── utils/                    # Utilities
│
├── providers/                    # React context providers
├── stores/                       # Zustand state stores
├── types/                        # TypeScript type definitions
├── constants/                    # App constants
└── styles/                       # Global styles

tests/
├── unit/                         # Unit tests
├── integration/                  # Integration tests
├── e2e/                          # E2E tests (Playwright)
└── setup.ts                      # Test setup
```
