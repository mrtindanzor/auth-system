# Reference

## Configuration Options

### `AuthServiceOptions`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `baseUrl` | `string` | Yes | — | Base URL for all auth API requests |
| `endpoints.login` | `{ method: "post"; url: string }` | Yes | — | Login endpoint configuration |
| `endpoints.register` | `{ method: "put" \| "post"; url: string }` | Yes | — | Register endpoint configuration |
| `endpoints.logout` | `{ method: "post" \| "get"; url: string }` | Yes | — | Logout endpoint configuration |
| `endpoints.refresh` | `{ method: "get" \| "post"; url: string }` | Yes | — | Refresh endpoint configuration |
| `endpoints.requestPasswordReset` | `{ method: "post"; url: string }` | No | — | Optional. Request password reset endpoint |
| `endpoints.resetPassword` | `{ method: "post"; url: string }` | No | — | Optional. Reset password endpoint |
| `getAccessToken` | `() => string \| null` | No | — | Token getter. Wired internally by `createAuthClient`. Required for `createAuthService`. |

### `AuthGuardConfig`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `protectedPaths` | `string[]` | Yes | — | Paths requiring authentication |
| `authPaths` | `string[]` | Yes | — | Paths only for unauthenticated users |
| `isAuthenticated` | `() => boolean` | Yes | — | Client-side auth check. Wired internally by `createAuthClient`. |
| `isAuthenticatedServer` | `() => Promise<boolean>` | No | — | Server-side auth check for SSR |
| `onUnauthenticated` | `(currentPath: string) => void` | Yes | — | Redirect callback when unauthenticated |
| `onAuthenticated` | `(currentPath?: string) => void` | Yes | — | Redirect callback when authenticated |

## Types

### `AuthState`

```typescript
type AuthState = {
  accessToken: string | null;
  isLoggedIn: boolean;       // Derived: !!accessToken
  hasRefreshed: boolean;     // Set to true after first setAccessToken call
};
```

### `AuthStore`

```typescript
type AuthStore = AuthState & {
  setAccessToken: (accessToken: string | null) => void;
  getAccessToken: () => string | null;
  logout: () => void;
};
```

### `AuthActions`

```typescript
type AuthActions = {
  setAccessToken: (accessToken: string | null) => void;
  getAccessToken: () => string | null;
  logout: () => void;
};
```

### `IAuthService`

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

### `UserStore<T>`

```typescript
type UserStore<T extends object> = {
  user: T | null;
  setUser: (accessToken: string | null) => void;
  updateUser: <K extends keyof T>(key: K, payload: T[K]) => void;
  getUser: () => T | null;
  clearUser: () => void;
};
```

### `AuthGuardConfig`

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

### `AuthServiceOptions`

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

### API Types (Internal)

```typescript
type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type AuthApiResponse<T> = T & AuthTokens;

type AuthEndpoints = {
  login: string;
  register: string;
  logout: string;
  refresh: string;
  requestPasswordReset?: string;
  resetPassword?: string;
};

type AuthApiConfig = {
  baseUrl: string;
  getAccessToken?: () => string | null;
  withCredentials?: boolean;  // Default: true
};
```

## Error Classes (Internal)

| Class | `status` | Default Message | `name` |
|---|---|---|---|
| `AppError` | 500 | Custom | `"AppError"` |
| `UnauthorizedError` | 401 | `"Unauthorized"` | `"UnauthorizedError"` |
| `ForbiddenError` | 403 | `"Forbidden"` | `"ForbiddenError"` |

All error classes extend `Error` and add a `status` property.

## Defaults

| Item | Default Value | Description |
|---|---|---|
| `withCredentials` | `true` | Axios requests always send cookies |
| `hasRefreshed` initial | `false` | Refresh hook will attempt refresh on mount |
| `isLoggedIn` initial | `false` | Derived from `!!accessToken` |
| `accessToken` initial | `null` | No token until login or refresh |
| `user` initial | `null` | No user until token is decoded |

## Implementation Details

### JWT Claim Stripping

Both `decodeUserFromToken` (frontend) and `AuthService.verifyToken` (backend) strip the same standard JWT claims from the payload:

- `iat` (Issued At)
- `exp` (Expiration Time)
- `iss` (Issuer)
- `aud` (Audience)
- `sub` (Subject)
- `jti` (JWT ID)
- `nbf` (Not Before)

This means your custom claims should not use these names.

### Auth Store State Transitions

```
Initial State:
  { accessToken: null, isLoggedIn: false, hasRefreshed: false }

setAccessToken(token):
  { accessToken: token, isLoggedIn: true, hasRefreshed: true }

setAccessToken(null):
  { accessToken: null, isLoggedIn: false, hasRefreshed: true }

logout():
  { accessToken: null, isLoggedIn: false, hasRefreshed: true }
```

Note that `hasRefreshed` transitions from `false` to `true` on the first `setAccessToken` call and never resets within the same session lifecycle.

### User Store State Transitions

```
Initial State:
  { user: null }

setUser(accessToken):
  { user: decodeUserFromToken(accessToken) }
  // If token is null or invalid, user = null

setUser(null):
  { user: null }

clearUser():
  { user: null }

updateUser(key, value):
  { user: { ...user, [key]: value } }
  // No-op if user is null
```

### HTTP Method Flexibility

Each endpoint allows specific HTTP methods:

| Endpoint | Allowed Methods | Rationale |
|---|---|---|
| `login` | `post` only | Security: login must be POST |
| `register` | `put` or `post` | Some APIs use PUT for upsert semantics |
| `logout` | `post` or `get` | GET for simple cookie clearing, POST for server-side cleanup |
| `refresh` | `get` or `post` | GET for cookie-only refresh, POST for body-based refresh |
| `requestPasswordReset` | `post` only | Standard for email-sending actions |
| `resetPassword` | `post` only | Standard for password changes |

### Error Handling in Hooks

The hooks use `tryCatch` (tuple-based) to handle errors. On failure:

1. The error is caught (no unhandled promise rejection)
2. `fe(error)` extracts a human-readable message
3. `setError("root", { message })` sets it as a form-level error
4. The form remains in a usable state (not crashed)

For `useLogout`, errors are silently ignored — the user sees no error if the server-side logout fails.
