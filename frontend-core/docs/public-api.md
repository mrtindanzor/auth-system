# Public API

This page documents all exports from `@tindanzor/auth-client`. The package has a single entry point (`src/index.ts`) that exposes four top-level exports. Additional internal APIs are documented at the bottom of this page.

## Public Exports

### `createAuthClient`

The primary entry point. Creates and wires together all auth infrastructure in a single call.

```typescript
function createAuthClient<
  TUser extends object,
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object = object,
  TRequestPasswordReset extends object = object,
>(
  options: Omit<AuthServiceOptions, "getAccessToken">,
  authGuardConfig: Omit<AuthGuardConfig, "isAuthenticated">,
): {
  useAuthStore: UseBoundStore<StoreApi<AuthStore>>;
  useAuthService: () => IAuthService<TLogin, TRegister, TResetPassword, TRequestPasswordReset>;
  useUserStore: UseBoundStore<StoreApi<UserStore<TUser>>>;
  useLogout: () => { logout: () => Promise<void> };
  useSignin: (props?: { resolver?: Resolver<TLogin> }) => { register, formState, onSubmit };
  useSignup: (props?: { resolver?: Resolver<TRegister> }) => { register, formState, onSubmit };
  authGuard: { assertAuthenticated, assertNotAuthenticated, enforce };
  useAuthRefresh: () => void;
}
```

**Type Parameters:**

| Parameter | Description |
|---|---|
| `TUser` | Shape of the user object decoded from the JWT payload |
| `TLogin` | Shape of the login form/request payload |
| `TRegister` | Shape of the registration form/request payload |
| `TResetPassword` | Shape of the reset password payload (optional, defaults to `object`) |
| `TRequestPasswordReset` | Shape of the request password reset payload (optional, defaults to `object`) |

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `options` | `AuthServiceOptions` | Auth service configuration (base URL, endpoints). `getAccessToken` is omitted because it is derived internally from the auth store. |
| `authGuardConfig` | `AuthGuardConfig` | Route guard configuration (paths, callbacks). `isAuthenticated` is omitted because it is derived internally from the auth store. |

**Returns:** An object with 8 properties — 4 Zustand stores/hooks, 2 form hooks, a route guard, and a refresh hook.

**Example:**

```typescript
const {
  useSignin, useSignup, useLogout,
  useAuthRefresh, useAuthStore, useUserStore,
  useAuthService, authGuard,
} = createAuthClient<AppUser, LoginPayload, RegisterPayload>(
  {
    baseUrl: "https://api.example.com",
    endpoints: {
      login: { method: "post", url: "/auth/login" },
      register: { method: "post", url: "/auth/register" },
      logout: { method: "post", url: "/auth/logout" },
      refresh: { method: "get", url: "/auth/refresh" },
    },
  },
  {
    protectedPaths: ["/dashboard"],
    authPaths: ["/signin"],
    onUnauthenticated: (path) => router.push(`/signin?next=${path}`),
    onAuthenticated: () => router.push("/"),
  },
);
```

---

### `createAuthStore`

Creates a Zustand store for authentication state.

```typescript
function createAuthStore(): UseBoundStore<StoreApi<AuthStore>>
```

**Returns:** A Zustand store with the following shape:

| Field | Type | Description |
|---|---|---|
| `accessToken` | `string \| null` | The current JWT access token |
| `isLoggedIn` | `boolean` | Derived from `!!accessToken` |
| `hasRefreshed` | `boolean` | Set to `true` after `setAccessToken` is called (prevents refresh loops) |
| `setAccessToken(token)` | `(token: string \| null) => void` | Sets the token, derives `isLoggedIn`, sets `hasRefreshed = true` |
| `getAccessToken()` | `() => string \| null` | Synchronous getter for the current token |
| `logout()` | `() => void` | Clears `accessToken` and `isLoggedIn`. Does NOT reset `hasRefreshed`. |

**Example:**

```typescript
import { createAuthStore } from "@tindanzor/auth-client";

const useAuthStore = createAuthStore();

// Set token after login
useAuthStore.getState().setAccessToken(accessToken);

// Read state
const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

// Logout
useAuthStore.getState().logout();
```

---

### `createAuthService`

Creates an auth service for making HTTP requests to your auth endpoints.

```typescript
function createAuthService<
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object,
  TRequestPasswordReset extends object,
>(options: AuthServiceOptions): IAuthService<TLogin, TRegister, TResetPassword, TRequestPasswordReset>
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `options.baseUrl` | `string` | Base URL for all requests |
| `options.endpoints` | `object` | Map of endpoint configurations (see [Configuration](#authserviceoptions)) |
| `options.getAccessToken` | `() => string \| null` | Function that returns the current access token |

**Returns:** An `IAuthService` with these methods:

| Method | Signature | Description |
|---|---|---|
| `login(payload)` | `(payload: TLogin) => Promise<string>` | POSTs to login endpoint, returns `accessToken` |
| `register(payload)` | `(payload: TRegister) => Promise<string>` | POSTs/PUTs to register endpoint, returns `accessToken` |
| `logout()` | `() => Promise<void>` | Calls logout endpoint |
| `refresh()` | `() => Promise<string>` | Calls refresh endpoint, returns `accessToken` |
| `requestPasswordReset?(payload)` | `(payload: TRequestPasswordReset) => Promise<void>` | Optional. Throws `ForbiddenError` if endpoint not configured |
| `resetPassword?(payload)` | `(payload: TResetPassword) => Promise<void>` | Optional. Throws `ForbiddenError` if endpoint not configured |

**Example:**

```typescript
import { createAuthService } from "@tindanzor/auth-client";

const authService = createAuthService({
  baseUrl: "https://api.example.com",
  endpoints: {
    login: { method: "post", url: "/auth/login" },
    register: { method: "post", url: "/auth/register" },
    logout: { method: "post", url: "/auth/logout" },
    refresh: { method: "get", url: "/auth/refresh" },
  },
  getAccessToken: () => useAuthStore.getState().accessToken,
});

const accessToken = await authService.login({ email: "user@example.com", password: "pass" });
```

---

### `createAuthGuard`

Creates a route guard for protecting pages based on authentication status.

```typescript
function createAuthGuard(config: AuthGuardConfig): {
  assertAuthenticated: (pathname: string, runtime?: "client" | "server") => Promise<void>;
  assertNotAuthenticated: (pathname: string, runtime?: "client" | "server") => Promise<void>;
  enforce: (pathname: string, runtime?: "client" | "server") => Promise<void>;
}
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `protectedPaths` | `string[]` | Paths that require authentication. Uses `startsWith` matching. |
| `authPaths` | `string[]` | Paths only for unauthenticated users (login, register pages). Uses `startsWith` matching. |
| `isAuthenticated` | `() => boolean` | Client-side auth check. Usually `() => useAuthStore.getState().isLoggedIn`. |
| `isAuthenticatedServer?` | `() => Promise<boolean>` | Optional server-side auth check for SSR. |
| `onUnauthenticated` | `(currentPath: string) => void` | Called when an unauthenticated user accesses a protected path. |
| `onAuthenticated` | `(currentPath?: string) => void` | Called when an authenticated user accesses an auth-only path. |

**Methods:**

| Method | Description |
|---|---|
| `assertAuthenticated(pathname, runtime?)` | If `pathname` starts with any protected path and user is NOT authenticated, calls `onUnauthenticated`. |
| `assertNotAuthenticated(pathname, runtime?)` | If `pathname` starts with any auth path and user IS authenticated, calls `onAuthenticated`. |
| `enforce(pathname, runtime?)` | Runs both assertions in sequence: `assertNotAuthenticated` first, then `assertAuthenticated`. |

**Runtime Parameter:** Defaults to `"client"`. When set to `"server"`, uses `isAuthenticatedServer` if provided.

**Example:**

```typescript
const guard = createAuthGuard({
  protectedPaths: ["/profile", "/dashboard"],
  authPaths: ["/signin", "/signup"],
  isAuthenticated: () => useAuthStore.getState().isLoggedIn,
  isAuthenticatedServer: async () => {
    // Check httpOnly cookie on the server
    return await checkAuthCookie();
  },
  onUnauthenticated: (path) => router.push(`/signin?next=${path}`),
  onAuthenticated: () => router.push("/"),
});

// In your router middleware
await guard.enforce(pathname, "client");
```

---

### Types

#### `AuthGuardConfig`

```typescript
type AuthGuardConfig = {
  protectedPaths: string[];
  authPaths: string[];
  isAuthenticated: () => boolean;
  isAuthenticatedServer?(): Promise<boolean>;
  onUnauthenticated: (currentPath: string) => void;
  onAuthenticated: (currentPath?: string) => void;
};
```

#### `AuthState`

```typescript
type AuthState = {
  accessToken: string | null;
  isLoggedIn: boolean;
  hasRefreshed: boolean;
};
```

#### `AuthStore`

```typescript
type AuthStore = AuthState & {
  setAccessToken: (accessToken: string | null) => void;
  getAccessToken: () => string | null;
  logout: () => void;
};
```

#### `IAuthService`

```typescript
interface IAuthService<
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object,
  TRequestPasswordReset extends object,
> {
  login(payload: TLogin): Promise<string>;
  register(payload: TRegister): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<string>;
  requestPasswordReset?(payload: TRequestPasswordReset): Promise<void>;
  resetPassword?(payload: TResetPassword): Promise<void>;
}
```

#### `AuthServiceOptions`

```typescript
type AuthServiceOptions = {
  baseUrl: string;
  endpoints: {
    login: { method: "post"; url: string };
    register: { method: "put" | "post"; url: string };
    logout: { method: "post" | "get"; url: string };
    refresh: { method: "get" | "post"; url: string };
    requestPasswordReset?: { method: "post"; url: string };
    resetPassword?: { method: "post"; url: string };
  };
  getAccessToken?: () => string | null;
};
```

---

## Internal APIs

The following modules are exported from internal barrel files but are **not part of the public `exports` map**. They are used internally by the package. You can access them via deep imports (e.g., `@tindanzor/auth-client/src/utils/tryCatch`), but this is not guaranteed to work with all bundler configurations.

### `decodeUserFromToken`

Decodes a JWT and returns the payload minus standard JWT claims (`iat`, `exp`, `iss`, `aud`, `sub`, `jti`, `nbf`). Uses `jose`'s `decodeJwt` — this does **not** verify the token signature.

```typescript
function decodeUserFromToken<T extends object>(token: string | null): T | null
```

### `createUserStore`

Creates a Zustand store for the decoded user object. Used internally by `createAuthClient`.

```typescript
function createUserStore<T extends object>(): UseBoundStore<StoreApi<UserStore<T>>>
```

**`UserStore<T>` shape:**

| Field | Type | Description |
|---|---|---|
| `user` | `T \| null` | The decoded user object |
| `setUser(accessToken)` | `(token: string \| null) => void` | Decodes the JWT and sets the user |
| `updateUser(key, value)` | `(key: K, value: T[K]) => void` | Partially updates a single user field |
| `getUser()` | `() => T \| null` | Synchronous getter |
| `clearUser()` | `() => void` | Sets user to null |

### `createAuthAxiosClient`

Creates a pre-configured `AxiosInstance` with base URL, authorization header, and credentials. Note: the token is captured at creation time, not lazily evaluated on each request.

```typescript
function createAuthAxiosClient(config: AuthApiConfig): AxiosInstance
```

### `createUseAuth`

Factory that creates the `useSignin`, `useSignup`, and `useLogout` React hooks. Used internally by `createAuthClient`.

### `createUseAuthRefresh`

Factory that creates the `useAuthRefresh` React hook. Used internally by `createAuthClient`.

### `createUseAuthService`

Factory that creates a memoized `useAuthService` React hook. Used internally by `createAuthClient`.

### Error Classes

| Class | Status | Default Message |
|---|---|---|
| `AppError` | 500 | `"Internal Server Error"` |
| `UnauthorizedError` | 401 | `"Unauthorized"` |
| `ForbiddenError` | 403 | `"Forbidden"` |

### Utilities

```typescript
// Tuple-based async error handling
async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<[T | null, E | null]>

// Tuple-based sync error handling
function syncTryCatch<T, E = Error>(callback: () => T): [T | null, E | null]

// Error message extractor
const fe = (error: unknown): string => { ... }
// Returns: error string as-is, Error.message, or "Something went wrong"
```

### API Types

```typescript
type AuthTokens = { accessToken: string; refreshToken?: string };
type AuthApiResponse<T> = T & AuthTokens;
type AuthEndpoints = { login: string; register: string; logout: string; refresh: string; requestPasswordReset?: string; resetPassword?: string };
type AuthApiConfig = { baseUrl: string; getAccessToken?: () => string | null; withCredentials?: boolean };
```
