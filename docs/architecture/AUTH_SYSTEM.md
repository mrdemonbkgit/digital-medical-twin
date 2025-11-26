# Authentication System

> Last Updated: 2025-11-26

## Summary

Authentication and authorization architecture for Digital Medical Twin. Uses Supabase Auth with email/password for secure, managed authentication.

## Keywords

`authentication` `auth` `login` `password` `session` `security` `email` `supabase`

## Table of Contents

- [Auth Flow Overview](#auth-flow-overview)
- [Implementation Status](#implementation-status)
- [Registration](#registration)
- [Login](#login)
- [Session Management](#session-management)
- [Security Considerations](#security-considerations)

---

## Auth Flow Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│Supabase Auth│────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │   Session Token   │
      ◀───────────────────┘
      │
      │   Auto-managed
      ▼
┌─────────────┐
│ Protected   │
│   Routes    │
└─────────────┘
```

**Note:** We use Supabase Auth's email/password authentication instead of custom username/password. This provides:
- Automatic password hashing and validation
- Built-in session management with auto-refresh
- Row Level Security (RLS) integration
- Secure token handling

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email/password registration | Implemented | Phase 1 |
| Email/password login | Implemented | Phase 1 |
| Logout | Implemented | Phase 1 |
| Protected routes | Implemented | Phase 1 |
| Password reset | Not implemented | Future phase |
| Email verification | Not implemented | Future phase |

---

## Registration

### Flow

1. User submits email + password
2. Supabase validates and creates user
3. User settings record auto-created via trigger
4. User is logged in automatically

### Validation Rules

| Field | Rules |
|-------|-------|
| email | Valid email format, unique |
| password | Min 8 characters |

### Client Implementation

```typescript
// src/api/auth.ts
export async function register(credentials: RegisterCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });
  // ...
}
```

---

## Login

### Flow

1. User submits email + password
2. Supabase validates credentials
3. Session token returned and stored
4. Client redirected to dashboard

### Client Implementation

```typescript
// src/api/auth.ts
export async function login(credentials: LoginCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  // ...
}
```

---

## Session Management

### Supabase Session

Supabase handles session management automatically:

- Sessions stored in localStorage by default
- Auto-refresh before expiration
- Persists across browser tabs

### Auth Context

```typescript
// src/context/AuthContext.tsx
// - Checks session on mount
// - Listens to onAuthStateChange
// - Provides user, isAuthenticated, isLoading
// - Exposes login, logout, register functions
```

### Protected Routes

```typescript
// src/components/auth/ProtectedRoute.tsx
// - Checks isAuthenticated
// - Shows loading spinner during check
// - Redirects to /login if not authenticated
```

---

## Security Considerations

### Supabase-Managed Security

- Password hashing handled by Supabase (bcrypt equivalent)
- Rate limiting built-in
- Session tokens secure by default
- HTTPS enforced

### Row Level Security

All database tables use RLS policies ensuring users can only access their own data:

```sql
create policy "Users can manage own data" on public.events
  for all using (auth.uid() = user_id);
```

### Client-Side

- Auth state stored in React Context
- Tokens managed by Supabase client
- No manual token handling required

---

## Related Documents

- /docs/architecture/DATABASE_SCHEMA.md — User model
- /docs/development/API_CONTRACTS.md — Auth API details
