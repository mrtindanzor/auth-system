# `@tindanzor/auth-client`

Authentication framework for React frontend applications.

Extracted from MyGhMart's authentication system. Provides auth store, JWT decode, login/register/logout/refresh/password-reset, route guards, user store, auth hooks, and an auth API client.

## Scope

This library contains **only** authentication infrastructure.

If a module would still exist without authentication in the application, it does not belong here.

## Architecture

```
Application
  └── @tindanzor/auth-client (authentication framework)
        ├── api/client.ts       Auth axios instance
        ├── api/types.ts        Auth endpoint + token types
        ├── auth/store.ts       Zustand auth store (access token, refresh state)
        ├── auth/tokens.ts      JWT decode utility (strips JWT claims)
        ├── auth/service.ts     Auth service (login, register, refresh, logout, password reset)
        ├── auth/middleware.ts   Route guard factory
        ├── auth/hooks/         useAuth, useAuthRefresh, useAuthService
        ├── user/store.ts       Zustand user store (decoded from JWT)
        ├── errors/             AppError, UnauthorizedError, ForbiddenError
        └── utils/              tryCatch, syncTryCatch, fe
```

## Usage

### Installation

```bash
pnpm add @tindanzor/auth-client
```

Peer dependencies: `react` (^19), `react-dom` (^19), `axios` (^1).

### Quick Setup — `createAuthClient`

For most apps, the easiest entry point is `createAuthClient`. It wires together the auth store, user store, service, and hooks in a single call.

```typescript
import { createAuthClient } from "@tindanzor/auth-client";

type AppUser = { id: string; name: string; email: string };
type LoginPayload = { credentials: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

export const {
  useAuthStore,
  useAuthService,
  useUserStore,
  useAuth,
  authGuard,
  useAuthRefresh,
} = createAuthClient<AppUser, LoginPayload, RegisterPayload>(
  {
    baseUrl: "https://api.example.com",
    endpoints: {
      login: "/auth/login",
      register: "/auth/register",
      logout: "/auth/logout",
      refresh: "/auth/refresh",
    },
  },
  {
    protectedPaths: ["/profile", "/dashboard"],
    authPaths: ["/signin", "/signup"],
    isAuthenticatedServer: () => { /* server function to return logged in status, eg. server function that checks if auth cookie is set*/ },
    onUnauthenticated: (path) => { /* redirect to /signin */ },
    onAuthenticated: () => { /* redirect to / */ },
  },
);
```

### Lower-level Building Blocks

You can also compose the pieces manually if you need more control.

#### Auth Store

```typescript
import { createAuthStore } from "@tindanzor/auth-client";

const useAuthStore = createAuthStore();

// After login
useAuthStore.getState().setAccessToken(accessToken);

// Check state
const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
const hasRefreshed = useAuthStore((s) => s.hasRefreshed);
const token = useAuthStore((s) => s.getAccessToken());

// On logout
useAuthStore.getState().logout();
```

#### Auth Service

```typescript
import { createAuthService } from "@tindanzor/auth-client";

const authService = createAuthService({
  baseUrl: "https://api.example.com",
  endpoints: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    requestPasswordReset: "/auth/request-password-reset", // optional
    resetPassword: "/auth/reset-password",                 // optional
  },
  getAccessToken: () => useAuthStore.getState().accessToken,
});

// Login
const accessToken = await authService.login({ credentials: "user@example.com", password: "mypassword" });

// Refresh
const newToken = await authService.refresh();

// Password reset
await authService.requestPasswordReset?.({ email: "user@example.com" });
await authService.resetPassword?.({ token: "...", password: "newpass" });
```

#### JWT Decode

```typescript
import { decodeUserFromToken } from "@tindanzor/auth-client";

type AppUser = { id: string; name: string; email: string };
const user = decodeUserFromToken<AppUser>(accessToken);
// Strips standard JWT claims (iat, exp, iss, aud, sub, jti, nbf)
```

#### User Store

```typescript
import { createUserStore } from "@tindanzor/auth-client";

type AppUser = { id: string; name: string; email: string };
const useUserStore = createUserStore<AppUser>();

// Set user from token after login
useUserStore.getState().setUser(accessToken);

// Read user
const user = useUserStore((s) => s.user);

// Update a single field
useUserStore.getState().updateUser("name", "New Name");

// Clear
useUserStore.getState().clearUser();
```

#### Route Guards

```typescript
import { createAuthGuard } from "@tindanzor/auth-client";

const guard = createAuthGuard({
  protectedPaths: ["/profile", "/dashboard"],
  authPaths: ["/signin", "/signup"],
  isAuthenticatedServer: () => { /* server function to return logged in status, eg. server function that checks if auth cookie is set*/ },
  onUnauthenticated: (path) => { /* redirect to /signin?next= */ },
  onAuthenticated: () => { /* redirect to / */ },
});

// Methods
guard.enforce("/profile/settings");
guard.assertAuthenticated("/profile/settings");
guard.assertNotAuthenticated("/signin");
```

#### Auth Hooks

```typescript
import { createUseAuthService, createUseAuthRefresh, createUseAuth } from "@tindanzor/auth-client";

// 1. Service hook (memoises auth service with token getter)
const useAuthService = createUseAuthService(useAuthStore, {
  baseUrl: "https://api.example.com",
  endpoints: { /* ... */ },
});

// 2. Refresh hook (silently refreshes token on mount)
const useAuthRefresh = createUseAuthRefresh(useAuthStore, useUserStore, useAuthService);

// 3. Auth hook (login, register, logout + updates stores)
type AppUser = { id: string; name: string; email: string };
const useAuth = createUseAuth<AppUser>(useAuthStore, useUserStore, useAuthService);

// --- In component ---
useAuthRefresh(); // Attempt token refresh on mount

const { login, register, logout } = useAuth();
await login({ credentials: "email", password: "pass" });
```

#### API Client

```typescript
import { createAuthAxiosClient } from "@tindanzor/auth-client";

const axios = createAuthAxiosClient({
  baseUrl: "https://api.example.com",
  getAccessToken: () => useAuthStore.getState().accessToken,
  withCredentials: true, // default: true
});
```

#### Utilities

```typescript
import { tryCatch, syncTryCatch, fe } from "@tindanzor/auth-client";

const [data, error] = await tryCatch(fetch("/api"));
const [result, err] = syncTryCatch(() => JSON.parse(raw));

const message = fe(error); // "Something went wrong" (fallback)
```

#### Error Types

```typescript
import { AppError, UnauthorizedError, ForbiddenError } from "@tindanzor/auth-client";
```

## Configuration Over Modification

Applications supply:

- **API base URL** and **auth endpoints**
- **Access token getter** for API requests
- **Auth store** for token state
- **User store** for decoded user state
- **Protected/auth path lists** for route guards
