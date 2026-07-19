# Package Structure

```
frontend-core/
├── src/
│   ├── index.ts                    # Main entry point — public API exports
│   │
│   ├── api/                        # HTTP client and API types
│   │   ├── index.ts                # Barrel exports
│   │   ├── client.ts               # createAuthAxiosClient — configured Axios instance
│   │   └── types.ts                # AuthTokens, AuthApiResponse, AuthEndpoints
│   │
│   ├── auth/                       # Core authentication logic
│   │   ├── index.ts                # Barrel exports (internal)
│   │   ├── createAuthClient.ts     # Top-level factory — wires everything together
│   │   ├── middleware.ts            # createAuthGuard — route protection
│   │   ├── service.ts              # AuthService — HTTP auth requests
│   │   ├── store.ts                # Zustand auth store — token and login state
│   │   ├── tokens.ts               # decodeUserFromToken — JWT decode utility
│   │   │
│   │   └── hooks/                  # React hook factories
│   │       ├── useAuth.ts          # createUseAuth — login/register/logout hooks
│   │       ├── useAuthRefresh.ts   # createUseAuthRefresh — silent refresh on mount
│   │       └── useAuthService.ts   # createUseAuthService — memoized service hook
│   │
│   ├── errors/                     # Error classes (internal)
│   │   ├── index.ts
│   │   └── errors.ts              # AppError, UnauthorizedError, ForbiddenError
│   │
│   ├── user/                       # User state management
│   │   ├── index.ts
│   │   └── store.ts               # createUserStore — Zustand user store
│   │
│   ├── utils/                      # Shared utilities (internal)
│   │   ├── index.ts
│   │   ├── fe.ts                   # fe — error message extractor
│   │   └── tryCatch.ts            # tryCatch, syncTryCatch — error handling helpers
│   │
│   └── test/                       # Dev/test app (not published)
│       ├── test.main.tsx
│       └── test.App.tsx
│
├── docs/                           # This documentation
├── package.json
├── tsconfig.json
└── vite.config.ts                  # Dev server config (port 3000)
```

## Module Responsibilities

### `api/` — HTTP Client & Types

Contains the Axios instance factory and the core API type definitions. This module is responsible for making authenticated HTTP requests to your backend.

- **`client.ts`** — Creates a pre-configured `AxiosInstance` with base URL, authorization header, and credential settings. Used internally by `AuthService` and available for direct use if you need an authenticated Axios client for non-auth API calls.
- **`types.ts`** — Defines `AuthTokens` (access + optional refresh token), `AuthApiResponse<T>` (generic response intersected with tokens), and `AuthEndpoints` (endpoint URL map).

### `auth/` — Core Authentication

The heart of the package. Contains the auth service, store, route guards, and all React hooks.

- **`createAuthClient.ts`** — The top-level factory. Creates all stores, services, hooks, and the auth guard, wiring them together. This is the primary entry point for most applications.
- **`service.ts`** — `AuthService` class and `createAuthService` factory. Handles all HTTP communication: login, register, logout, refresh, and password reset. Uses `axios` internally with `withCredentials: true`.
- **`store.ts`** — Zustand store for auth state: `accessToken`, `isLoggedIn` (derived), and `hasRefreshed` (prevents refresh loops).
- **`middleware.ts`** — Route guard factory. Creates `assertAuthenticated`, `assertNotAuthenticated`, and `enforce` functions for protecting routes.
- **`tokens.ts`** — JWT decode utility (client-side, no verification). Strips standard JWT claims and returns the remaining payload as the user type.

### `auth/hooks/` — React Hook Factories

Factory functions that create React hooks. Each closes over store references to avoid context providers.

- **`useAuth.ts`** — Creates `useSignin`, `useSignup`, and `useLogout` hooks. Each integrates with `react-hook-form` for form handling and manages store updates on success/error.
- **`useAuthRefresh.ts`** — Creates the `useAuthRefresh` hook that attempts a silent token refresh on component mount.
- **`useAuthService.ts`** — Creates a memoized `useAuthService` hook that instantiates `AuthService` with the current access token getter.

### `errors/` — Error Classes

Internal error hierarchy with HTTP status codes. Used by `AuthService` to throw typed errors (e.g., `ForbiddenError` when optional endpoints are not configured).

### `user/` — User State

- **`store.ts`** — Zustand store for user state. Holds the decoded JWT payload (minus standard claims) as the user object. Provides `setUser`, `updateUser`, `getUser`, and `clearUser` actions.

### `utils/` — Shared Utilities

Internal utilities used throughout the package.

- **`tryCatch.ts`** — Tuple-based async and sync error handling. Returns `[result, null]` on success, `[null, error]` on failure.
- **`fe.ts`** — Safely extracts a human-readable message from any thrown value (string, Error, or unknown).
