# Unit Test Coverage Check (Report Only)

Analyze unit test coverage and report gaps - do NOT write tests.

## Steps

1. **Scan source files** in `src/` and `api/` directories
2. **Compare against test files** (`*.test.ts`, `*.test.tsx`)
3. **Identify untested files**, excluding type definitions, index files, and config
4. **Categorize by priority**:
   - High priority: API, forms, hooks, business logic
   - Medium priority: Stateful components
   - Low priority: Simple presentational components

## Output

Provide a report showing:
- Current test count and file count
- Coverage percentage by category (components, hooks, pages, api, lib, utils)
- List of untested files grouped by priority
- Recommendations for next testing phase
