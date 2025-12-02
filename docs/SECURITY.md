# Security Documentation

> Last Updated: 2025-12-02 (Security hardening)

## Summary

Security architecture and best practices for the Digital Medical Twin application. Covers authentication, data protection, API key management, and security headers.

## Keywords

`security` `authentication` `encryption` `API keys` `JWT` `session` `headers`

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

### Encryption Architecture

AI provider API keys are encrypted using **AES-256-GCM** encryption, implemented server-side only.

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Size | 256 bits (32 bytes) |
| IV | 12 bytes, randomly generated per encryption |
| Auth Tag | 16 bytes, ensures data integrity |

### Storage

Encrypted keys are stored in the `user_settings` table:

```sql
user_settings
├── encrypted_openai_key    -- OpenAI API key (encrypted)
├── encrypted_google_key    -- Google/Gemini API key (encrypted)
└── encrypted_api_key       -- Legacy fallback (deprecated)
```

### Key Storage Flow

```
1. User enters API key in Settings page
   ↓
2. PUT /api/settings/ai sends key with Bearer token
   ↓
3. Server validates token via Supabase
   ↓
4. API key encrypted using ENCRYPTION_KEY env var
   ↓
5. Encrypted key stored in user_settings
   ↓
6. API returns success (never returns decrypted keys)
```

### Key Retrieval

The API never returns decrypted keys. Instead, it returns boolean flags:

```json
{
  "hasOpenAIKey": true,
  "hasGoogleKey": false,
  "provider": "openai",
  "model": "gpt-5.1"
}
```

### Key Deletion

```
DELETE /api/settings/ai?provider=openai
```

Clears the specified provider's encrypted key from the database.

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
| `ENCRYPTION_KEY` | API key encryption | Server-only, 32-byte base64 string |
| `SUPABASE_URL` | Alternative Supabase URL | Server configuration |
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
