# Database Migrations

This document explains how to run database migrations for the Digital Medical Twin project.

## Quick Start

```bash
node scripts/run-migrations.cjs
```

This will run all pending migrations in `supabase/migrations/` against your Supabase database.

## Prerequisites

1. **Supabase CLI Login**: You must be logged into the Supabase CLI:
   ```bash
   npx supabase login
   ```

2. **Environment Variables**: Ensure `SUPABASE_URL` is set in your `.env` file:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   ```

## How It Works

The migration script (`scripts/run-migrations.cjs`) uses the **Supabase Management API** instead of direct PostgreSQL connections. This is necessary because:

### The IPv6 Problem (WSL2)

Supabase's direct database connections (`db.*.supabase.co`) only support IPv6. WSL2 has limited IPv6 support by default, causing connection failures:

```
connect ENETUNREACH 2406:da18:243:... - Local (:::0)
```

### The Solution

The Management API (`api.supabase.com`) works over IPv4 and can execute SQL queries. Our script:

1. Reads the Supabase access token from `~/.supabase/access-token`
2. Extracts the project reference from `SUPABASE_URL`
3. Sends each SQL statement to the Management API endpoint:
   ```
   POST https://api.supabase.com/v1/projects/{project-ref}/database/query
   ```

## Creating New Migrations

1. Create a new SQL file in `supabase/migrations/` with the naming convention:
   ```
   YYYYMMDDHHMMSS_description.sql
   ```

   Example: `20241127100000_add_user_preferences.sql`

2. Write your SQL. The script handles:
   - `CREATE TABLE IF NOT EXISTS`
   - `CREATE INDEX IF NOT EXISTS`
   - `DO $$ ... END $$;` blocks
   - `CREATE OR REPLACE FUNCTION`
   - Standard DDL statements

3. Run the migration:
   ```bash
   node scripts/run-migrations.cjs
   ```

## Idempotent Migrations

Write migrations to be idempotent (safe to run multiple times):

```sql
-- Good: Won't fail if table exists
CREATE TABLE IF NOT EXISTS public.my_table (...);

-- Good: Won't fail if column exists
ALTER TABLE public.my_table
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Good: Use DO block for conditional logic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'my_table' AND column_name = 'my_column'
  ) THEN
    ALTER TABLE public.my_table ADD COLUMN my_column TEXT;
  END IF;
END $$;
```

## Troubleshooting

### "Supabase access token not found"

Login to Supabase CLI:
```bash
npx supabase login
```

### "Could not determine project reference"

Ensure `SUPABASE_URL` is set in `.env`:
```
SUPABASE_URL=https://your-project-ref.supabase.co
```

### "already exists" warnings

These are normal and safe to ignore. The script skips statements that create objects that already exist.

### Testing API connectivity

```bash
curl -s "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $(cat ~/.supabase/access-token)" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT 1"}'
```

## Alternative Methods

### Supabase Dashboard (Manual)

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql/new`
2. Paste your SQL
3. Click "Run"

### Supabase CLI (requires IPv6)

If you have working IPv6 connectivity:
```bash
npx supabase db push
```

Note: This often hangs at "Initialising login role..." in WSL2 due to IPv6 issues.

## File Structure

```
supabase/
└── migrations/
    ├── 20241126000000_create_events_table.sql
    ├── 20241127000000_create_user_settings_table.sql
    └── 20241127100000_alter_user_settings_add_columns.sql

scripts/
└── run-migrations.cjs    # Migration runner using Management API
```
