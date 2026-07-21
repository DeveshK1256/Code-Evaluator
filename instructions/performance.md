# Performance Guidelines

## Frontend

- Use React Server Components for initial page loads
- Lazy load heavy components with `next/dynamic`
- Optimize images with `next/image` (WebP, lazy loading)
- Use code splitting for route groups
- Minimize bundle size (no unnecessary imports)
- Virtual scroll for large lists

## Data Fetching

- Use TanStack Query with appropriate stale times
- Implement optimistic updates for mutations
- Cache API responses where possible
- Paginate large result sets
- Use Supabase Realtime for live updates

## AI Calls

- Use the 1M token context window efficiently
- Truncate large files before sending to Gemini
- Cache AI results by content fingerprint
- Run evaluations in parallel where possible
- Use Gemini Flash for faster/simpler tasks

## Database

- Index frequently queried columns
- Use connection pooling (pgBouncer)
- Select only needed columns
- Limit result sets with pagination

## Monitoring

- Track API response times
- Monitor AI API latency and costs
- Track cache hit rates
- Set up alerts for performance degradation
