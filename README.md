# Code Evaluator

AI-Powered Software Evaluation & Intelligence Platform.

Deep semantic analysis of software projects — simulating a review by experienced software architects, senior engineers, and security experts.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3 + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + OAuth-ready)
- **AI:** Gemini 2.5 Pro
- **State:** Zustand (UI) + TanStack Query (server)
- **Background:** Inngest
- **Hosting:** Vercel
- **Package Manager:** pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript checking |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   └── api/v1/           # Versioned API routes
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── common/           # Shared components
│   └── layout/           # Layout components
├── features/             # Feature modules
│   └── auth/             # Authentication feature
├── hooks/                # Shared React hooks
├── lib/                  # Core libraries
│   ├── api/              # API utilities
│   ├── auth/             # Auth clients
│   ├── db/               # Database
│   ├── gemini/           # Gemini AI (configured)
│   ├── logger/           # Logging
│   ├── security/         # Security utilities
│   └── utils/            # Utilities
├── providers/            # React providers
├── stores/               # Zustand stores
├── types/                # TypeScript types
├── constants/            # App constants
└── styles/               # Global styles
```

## Documentation

See the [docs](./docs) and [instructions](./instructions) directories for detailed documentation.

## License

MIT
