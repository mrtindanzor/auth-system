# frontend-core

Authentication framework for frontend applications.

Extracted from MyGhMart's authentication system. Provides auth store, JWT decode, login/register/logout/refresh, route guards, current user context, and auth API client.

## Scope

This library contains **only** authentication infrastructure.

If a module would still exist without authentication in the application, it does not belong here.

## Architecture

```
Application
  └── frontend-core (authentication framework)
        ├── api/client.ts       Auth axios instance + refresh interceptor
        ├── api/types.ts        Auth endpoint + token types
        ├── auth/store.ts       Zustand auth store (access token)
        ├── auth/tokens.ts      JWT decode utility
        ├── auth/service.ts     Auth service factory (login, register, refresh, logout)
        ├── auth/middleware.ts   Route guard factory
        ├── auth/hooks.ts       useAuthRefresh, useAuth hooks
        ├── user/store.ts       Zustand user store (decoded from JWT)
        ├── user/context.tsx     UserProvider + useUser context
        ├── errors/             UnauthorizedError
        └── utils/              tryCatch, fe
```

## Usage

### Installation

```bash
pnpm add frontend-core
```

Peer dependencies: `react`, `react-dom`, `axios`, `zustand`, `@tanstack/react-query`, `jose`.

### Auth Store

```typescript
import { createAuthStore } from "frontend-core";

// Create once at app root
const useAuthStore = createAuthStore();

// After login
useAuthStore.getState().setAccessToken(accessToken);

// Check state
const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
const token = useAuthStore((s) => s.getAccessToken());

// On logout
useAuthStore.getState().logout();
```

### Auth Service

```typescript
import { createAuthService } from "frontend-core";

const authService = createAuthService({
  baseUrl: "https://api.example.com",
  endpoints: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
  getAccessToken: () => useAuthStore.getState().accessToken,
});

// Login
const accessToken = await authService.login({
  credentials: "user@example.com",
  password: "mypassword",
});

// Refresh
const newToken = await authService.refresh();
```

### JWT Decode

```typescript
import { decodeUserFromToken } from "frontend-core";

type AppUser = { id: string; name: string; email: string };
const user = decodeUserFromToken<AppUser>(accessToken);
```

### User Store

```typescript
import { createUserStore } from "frontend-core";

type AppUser = { id: string; name: string; email: string };
const useUserStore = createUserStore<AppUser>();

// Set user after login
useUserStore.getState().setUser(accessToken);

// Read user
const user = useUserStore((s) => s.user);
```

### User Context

```typescript
import { createUserContext } from "frontend-core";

type AppUser = { id: string; name: string; email: string };
const { UserProvider, useUser, useOptionalUser } = createUserContext<AppUser>();

// Root layout
<UserProvider
  getUser={() => useUserStore.getState().user}
  subscribe={(listener) => useUserStore.subscribe(listener)}
  fallback={<Loading />}
>
  <App />
</UserProvider>

// In components
const user = useUser(); // AppUser or throws
```

### Route Guards

```typescript
import { createAuthGuard } from "frontend-core";

const guard = createAuthGuard({
  protectedPaths: ["/profile", "/dashboard"],
  authPaths: ["/signin", "/signup"],
  isAuthenticated: () => useAuthStore.getState().isLoggedIn,
  onUnauthenticated: (path) => { /* redirect to /signin?next= */ },
  onAuthenticated: () => { /* redirect to / */ },
});

// Call in route loader / middleware
guard.enforce("/profile/settings");
```

### Auth Hooks

```typescript
import { createUseAuthRefresh, createUseAuth } from "frontend-core";

const useAuthRefresh = createUseAuthRefresh(
  () => useAuthStore,
  () => authService,
);

const useAuth = createUseAuth<AppUser>(
  () => useAuthStore,
  () => authService,
  (accessToken) => useUserStore.getState().setUser(accessToken),
);

// In component:
useAuthRefresh(); // Silently refresh token on mount

const { login, register, logout } = useAuth();
await login({ credentials: "email", password: "pass" });
```

### API Client + Refresh Interceptor

```typescript
import { createAuthAxiosClient, attachTokenRefreshInterceptor } from "frontend-core";

const axios = createAuthAxiosClient({
  baseUrl: "https://api.example.com",
  getAccessToken: () => useAuthStore.getState().accessToken,
});

attachTokenRefreshInterceptor(
  axios,
  () => authService.refresh(),      // on 401, try refresh
  () => useAuthStore.getState().logout(), // on refresh fail
);
```

## Configuration Over Modification

Applications supply:

- **API base URL** and **auth endpoints**
- **Access token getter** for API requests
- **Auth store** for token state
- **User store** for decoded user state
- **User store subscriber** for context reactivity
- **Protected/auth path lists** for route guards
- **Refresh fail handler** for token refresh interceptor
