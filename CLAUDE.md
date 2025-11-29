# Digital Medical Twin - Claude Code Context

## Quick Start

1. Read /docs/ONBOARDING.md for project setup
2. Search /docs/INDEX.md for task-relevant docs
3. Follow /docs/AGENT_PROTOCOL.md for all work

## Critical Rules

- Never skip reading AGENT_PROTOCOL.md on first task
- Update /docs/INDEX.md when modifying any doc
- Check /docs/DECISION_LOG.md before architectural changes
- Do NOT include "Generated with Claude Code" or "Co-Authored-By: Claude" in commit messages

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run linter |

## Supabase Database Migrations

When creating database migrations:

1. **Create migration file** in `supabase/migrations/` with timestamp prefix (e.g., `20241203000000_description.sql`)

2. **Run migrations** using the Supabase Management API:
   ```bash
   PROJECT_REF="iepmzmelrdlopcaqkcyi"
   ACCESS_TOKEN=$(cat ~/.supabase/access-token)

   curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"query": "YOUR SQL HERE"}'
   ```

3. **Verify migration** by querying the database to confirm changes applied

Note: The access token is created when you run `supabase login`. The REST API (`supabase.co/rest/v1`) only supports DML (SELECT/INSERT/UPDATE/DELETE), not DDL (CREATE/ALTER/DROP). Use the Management API for schema changes.
