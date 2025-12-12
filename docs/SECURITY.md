# Security Documentation

> Last Updated: 2025-12-12 (Hosted service model documentation)

## Summary

Security architecture and best practices for the Digital Medical Twin application. Covers authentication, data protection, API key management, and security headers.

## Keywords

`security` `authentication` `API keys` `JWT` `session` `headers`

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [API Key Management](#api-key-management)
- [Data Protection](#data-protection)
- [Security Headers](#security-headers)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

---

## Authentication Flow

### Overview

The application uses Supabase Authentication with email/password credentials. Sessions are managed via JWT tokens with automatic refresh support.

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AuthContext` | `src/context/AuthContext.tsx` | Global auth state management |
| `useAuth` | `src/hooks/useAuth.ts` | Auth hook for components |
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | Route-level protection |
| Auth API | `src/api/auth.ts` | Login, register, logout functions |

### Authentication Process

```
1. User submits credentials (email/password)
   ↓
2. AuthContext calls api/auth.login() or register()
   ↓
3. Supabase handles password hashing & validation
   ↓
4. On success: JWT tokens issued, session created
   ↓
5. Auth state listener updates context
   ↓
6. Protected routes render based on isAuthenticated
```

### Session Lifecycle

1. **Login**: Supabase issues access and refresh tokens
2. **Persistence**: Session stored in browser storage (managed by Supabase)
3. **Monitoring**: `supabase.auth.onAuthStateChange()` detects session changes
4. **Refresh**: Supabase auto-refreshes tokens before expiry
5. **Logout**: `supabase.auth.signOut()` clears session

### Protected Routes

Routes wrapped with `<ProtectedRoute>` redirect to `/login` if unauthenticated:

- `/dashboard`
- `/timeline`
- `/event/*`
- `/settings`
- `/ai`

---

## API Key Management

### Hosted Service Model

This application uses a **hosted service model** where AI API keys are managed server-side via environment variables. Users do not provide their own API keys.

| Aspect | Implementation |
|--------|---------------|
| Key Storage | Server environment variables |
| User Control | Provider/model selection only |
| Billing | Service operator (not per-user) |

### Server-Side Keys

AI provider keys are configured as server environment variables:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI GPT-5.2 API access |
| `GOOGLE_API_KEY` | Google Gemini API access |

These keys are never exposed to clients and are only used in serverless API routes.

### User Settings

Users can configure their AI preferences in the Settings page:

```sql
user_settings
├── ai_provider             -- 'openai' or 'google'
├── ai_model                -- Model ID (e.g., 'gpt-5.2', 'gemini-3-pro-preview')
├── openai_reasoning_effort -- 'none', 'low', 'medium', 'high'
└── gemini_thinking_level   -- 'low', 'high'
```

### Settings Flow

```
1. User selects AI provider and model in Settings
   ↓
2. PUT /api/settings/ai validates and stores preferences
   ↓
3. Chat API uses stored preferences with server API keys
   ↓
4. Server-side validation ensures valid provider/model combinations
```

### Server-Side Validation

The `/api/settings/ai` endpoint validates model selections:

```typescript
const VALID_MODELS = {
  openai: ['gpt-5.2'],
  google: ['gemini-3-pro-preview'],
};
```

---

## Data Protection

### Row Level Security (RLS)

All database queries are filtered by `user_id`:

```sql
-- Example RLS policy
CREATE POLICY "Users can only access own events"
ON health_events
FOR ALL
USING (auth.uid() = user_id);
```

### Data Isolation

- **Events**: Filtered by `user_id` in all queries
- **Settings**: One row per user with `user_id` FK, explicitly scoped via `.eq('user_id', user.id)`
- **Lab Uploads**: All CRUD operations require authentication and filter by `user_id`
- **API calls**: Token validation extracts `userId`

### Defense in Depth

API functions implement explicit user scoping as a defense layer beyond RLS:

```typescript
// Pattern for authenticated API functions
async function getLabUploads(): Promise<LabUpload[]> {
  const userId = await getAuthenticatedUserId();

  const { data, error } = await supabase
    .from('lab_uploads')
    .select('*')
    .eq('user_id', userId)  // Explicit scoping
    .order('created_at', { ascending: false });
  // ...
}
```

This ensures data isolation even in contexts where RLS may be bypassed (service keys, admin scripts, SSR).

### Transport Security

- All API communication over **HTTPS**
- No sensitive data in URL parameters
- Bearer tokens in Authorization header only

### Client-Side Data

- Health event data transmitted in plaintext (HTTPS encrypted in transit)
- No client-side encryption of health data
- Relies on RLS policies for data isolation

---

## Security Headers

Configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Header Descriptions

| Header | Purpose |
|--------|---------|
| X-Content-Type-Options | Prevents MIME type sniffing |
| X-Frame-Options | Prevents clickjacking (no iframe embedding) |
| X-XSS-Protection | Enables browser XSS filtering |
| Referrer-Policy | Controls referrer header information |
| Permissions-Policy | Disables unused browser features |

---

## Environment Variables

### Public Variables (Client-Side)

These are embedded in the client bundle and are intentionally public:

| Variable | Purpose | Security |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Safe - public API endpoint |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Safe - limited scope via RLS |

### Server-Side Variables

These must **never** be exposed to the client:

| Variable | Purpose | Security |
|----------|---------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access | Server-only, bypasses RLS |
| `SUPABASE_URL` | Alternative Supabase URL | Server configuration |
| `OPENAI_API_KEY` | OpenAI API access | Server-only |
| `GOOGLE_API_KEY` | Google AI API access | Server-only |
| `ALLOWED_ORIGIN` | CORS origin restriction | Defaults to production URL |

### Validation

Missing required variables throw errors at startup:

```typescript
// src/lib/supabase.ts
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
```

---

## Best Practices

### Input Validation

- All form inputs validated before submission
- Server-side validation via Supabase constraints
- Sanitized user input (no raw HTML rendering)
- **PostgREST filter sanitization**: Search inputs sanitized via `escapePostgrestValue()` to prevent filter injection
  - Removes syntax-breaking characters: `,`, `(`, `)`
  - Escapes LIKE wildcards: `%` → `\%`, `_` → `\_`
  - Prevents query manipulation attacks

### Error Handling

- Generic error messages to users
- No sensitive data in error responses
- Server logs for debugging (not client-visible)

### API Endpoint Security

```typescript
// Pattern for authenticated endpoints
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');

const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  });
}

// Proceed with user.id for queries
```

### Future Enhancements

Not currently implemented but recommended for production:

- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting on AI chat endpoint (deferred - requires distributed storage like Vercel KV)
- [ ] Brute force protection
- [ ] API key rotation mechanism
- [ ] Audit logging for sensitive operations
- [ ] Content Security Policy (CSP) header

---

## Related Documentation

- [Auth System Architecture](/docs/architecture/AUTH_SYSTEM.md)
- [AI Integration (API Key Usage)](/docs/architecture/AI_INTEGRATION.md)
- [Database Schema](/docs/architecture/DATABASE_SCHEMA.md)
