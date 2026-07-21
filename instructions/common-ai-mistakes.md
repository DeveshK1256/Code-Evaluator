# Common AI Mistakes to Avoid

## While Coding

1. **Don't modify architecture** — Follow the existing patterns
2. **Don't redesign** — Work within the current structure
3. **Ask when ambiguous** — Don't guess requirements
4. **One file at a time** — Don't rewrite unrelated files
5. **Match existing patterns** — Same comment style, naming, idioms

## Code Quality

1. **Avoid over-abstraction** — Don't create unnecessary interfaces
2. **Don't add dependencies** — Unless specifically instructed
3. **Don't leave TODOs** — Implement or don't mention it
4. **No console.log** — Use the logger
5. **Handle all states** — Loading, empty, error, success

## Architecture

1. **Don't break the module pattern** — New modules = one folder + one registration
2. **Don't bypass the API layer** — All external calls through services
3. **Don't skip validation** — Zod at every API boundary
4. **Don't ignore auth** — Protected routes need checks

## Testing

1. **Don't skip tests** — New code needs tests
2. **Don't test implementation** — Test behavior
3. **Don't mock everything** — Integration tests have value
4. **Don't forget a11y tests** — Accessibility is mandatory
