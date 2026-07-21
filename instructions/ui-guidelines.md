# UI Guidelines

## Design System

- Use shadcn/ui components as primitives
- Custom components go in `components/common/`
- Use Tailwind CSS classes — avoid inline styles
- Follow the color system (CSS variables in globals.css)

## Accessibility (WCAG 2.2 AA)

- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`nav`, `main`, `button`, etc.)
- Add `aria-label` to icon-only buttons
- Use `aria-live` regions for dynamic content updates
- Ensure color contrast meets 4.5:1 ratio
- Respect `prefers-reduced-motion`

## Component States

Every component should handle:

1. **Loading** — Show skeleton or spinner
2. **Empty** — Show meaningful empty state with CTA
3. **Error** — Show error message with retry option
4. **Success** — Show the data/content
5. **Edge cases** — Handle missing data, long text, etc.

## Layout

- Use the AppShell layout for authenticated pages
- Responsive design: mobile-first, then tablet, then desktop
- Sidebar collapses on smaller screens
- Use the container class for content width constraints

## Theming

- Support light and dark modes
- Use CSS variables for colors
- Use `dark:` prefix for dark mode overrides
- Store theme preference in localStorage
