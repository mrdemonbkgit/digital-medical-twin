# Unit Test Coverage Analysis & Update

Analyze unit test coverage across the entire codebase and write tests for any gaps.

## Steps

1. **Scan source files** in `src/` and `api/` directories
2. **Compare against test files** (`*.test.ts`, `*.test.tsx`)
3. **Identify untested files**, excluding:
   - Type definitions (`types.ts`, `*.d.ts`)
   - Index/barrel files (`index.ts`)
   - Config files (`vite.config.ts`, etc.)
   - Constants-only files
4. **Prioritize by risk**:
   - High: API endpoints, forms, business logic, hooks
   - Medium: UI components with state/interactions
   - Low: Simple presentational components, wrappers
5. **Write comprehensive tests** for each untested file:
   - Rendering and props
   - User interactions
   - State changes
   - Error states and edge cases
   - Loading states where applicable
6. **Run full test suite** (`npm test`) to verify all pass
7. **Update documentation** (`docs/development/TESTING_STRATEGY.md`) with current metrics
8. **Report summary** of changes made

## Output

Provide a summary table showing:
- Files tested vs total files by category
- Number of new tests added
- Any files intentionally skipped (with reason)
