# `@tindanzor/auth-client`

Type-safe, hook-based authentication framework for React 19 applications. Provides JWT state management, login/signup/logout/refresh/password-reset hooks with `react-hook-form` integration, route guards, user state, and role-based access control — all wired together through a single factory call.

## Features

- **Single factory entry point** — `createAuthClient` wires stores, hooks, service, and guards together
- **Full type safety** — generic type parameters flow from form inputs through JWT decoding to store state
- **React Hook Form integration** — sign in, sign up, password reset hooks return `register`, `formState`, `onSubmit`
- **Silent token refresh** — `useAuthRefresh` attempts a refresh on mount using httpOnly cookies
- **Route guards** — client-side and server-side route protection with `startsWith` path matching
- **Dual-store architecture** — separate auth state (token, login status) and user state (decoded JWT payload)
- **Role-based access control** — built-in `roleChecker` with a fluent `.add(role).passes()` API
- **Password reset flows** — optional request and reset password hooks with success messaging
- **ESM-only** — modern package format, no CommonJS

## Installation

```bash
pnpm add @tindanzor/auth-client
```

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.0.0 | UI framework |
| `react-dom` | ^19.0.0 | DOM renderer |
| `axios` | ^1.0.0 | HTTP client (used by the auth service) |
| `react-hook-form` | ^7.80.0 | Form handling (used by auth hooks) |

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `jose` | ^5.0.0 | JWT decoding (client-side, no signature verification) |
| `zustand` | ^5.0.0 | State management for auth and user stores |

## Requirements

- **Node.js** 18+ (ES2020 target)
- **React** 19
- **TypeScript** recommended for full type safety

## Quick Start

### 1. Define your types

```typescript
type AppUser = {
  id: string;
  name: string;
  email: string;
  roles: ("admin" | "user")[];
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};
```

### 2. Create the auth client

```typescript
// auth.ts
import { createAuthClient } from "@tindanzor/auth-client";

export const {
  useAuthStore,
  useUserStore,
  useAuthService,
  useSignin,
  useSignup,
  useLogout,
  usePasswordReset,
  useRequestPasswordReset,
  useAuthRefresh,
  authGuard,
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
    protectedPaths: ["/dashboard", "/profile"],
    authPaths: ["/signin", "/signup"],
    onUnauthenticated: (path) => router.push(`/signin?next=${path}`),
    onAuthenticated: () => router.push("/"),
  },
);
```

### 3. Add token refresh to your root component

```tsx
import { useAuthRefresh } from "./auth";

function App() {
  useAuthRefresh();
  return <RouterProvider router={router} />;
}
```

### 4. Use hooks in components

```tsx
import { useSignin } from "./auth";

function SignInPage() {
  const { register, formState, onSubmit } = useSignin();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} type="password" placeholder="Password" />
      {formState.errors.root && <p>{formState.errors.root.message}</p>}
      <button type="submit" disabled={formState.isSubmitting}>Sign In</button>
    </form>
  );
}
```

## Configuration

### `AuthServiceOptions`

First argument to `createAuthClient`. Configures the HTTP auth service.

```typescript
{
  baseUrl: string;            // Base URL for all auth API requests

  endpoints: {
    login: {
      method: "post";         // Always "post"
      url: string;            // e.g., "/auth/login"
    };
    register: {
      method: "put" | "post"; // POST or PUT
      url: string;
    };
    logout: {
      method: "post" | "get"; // POST or GET
      url: string;
    };
    refresh: {
      method: "get" | "post"; // GET or POST
      url: string;
    };
    // Optional — enables password reset flows
    requestPasswordReset?: {
      method: "post";         // Always "post"
      url: string;            // e.g., "/auth/request-password-reset"
      resetPageDetails: {
        url: string;          // URL of your reset password page (included in the email)
        queryName: string;    // Query param name for the token (e.g., "access")
      };
    };
    resetPassword?: {
      method: "post";         // Always "post"
      url: string;            // e.g., "/auth/reset-password"
    };
  };
}
```

When using `createAuthClient`, `getAccessToken` is omitted — it is wired internally from the auth store.

### `AuthGuardConfig`

Second argument to `createAuthClient`. Configures route protection.

```typescript
{
  protectedPaths: string[];                    // Paths requiring authentication
  authPaths: string[];                         // Paths only for unauthenticated users (login, register)
  isAuthenticatedServer?(): Promise<boolean>;  // Optional server-side auth check for SSR
  onUnauthenticated: (currentPath: string) => void;  // Called when unauthenticated user hits a protected path
  onAuthenticated: (currentPath?: string) => void;   // Called when authenticated user hits an auth-only path
}
```

When using `createAuthClient`, `isAuthenticated` is omitted — it is wired internally from `useAuthStore.getState().isLoggedIn`.

### Expected API Response Shape

Your auth endpoints should return responses with this shape:

```typescript
{
  accessToken: string;    // JWT access token (required)
  refreshToken?: string;  // Optional (typically set as httpOnly cookie by the server)
  // ... additional fields are available via the generic response type
}
```

## Public API

Everything below is exported from the package entry point (`@tindanzor/auth-client`).

### `createAuthClient`

The primary entry point. Creates and wires together all auth infrastructure.

```typescript
function createAuthClient<
  TUser extends IUserAccount,
  TLogin extends object,
  TRegister extends object,
>(
  options: Omit<AuthServiceOptions, "getAccessToken">,
  authGuardConfig: Omit<AuthGuardConfig, "isAuthenticated">,
): { /* see return value below */ }
```

**Type Parameters:**

| Parameter | Constraint | Description |
|---|---|---|
| `TUser` | `IUserAccount` | User object decoded from the JWT payload. Must include `roles`. |
| `TLogin` | `object` | Shape of the login form/request payload |
| `TRegister` | `object` | Shape of the registration form/request payload |

**Parameters:**

| Parameter | Description |
|---|---|
| `options` | `AuthServiceOptions` — base URL and endpoint configuration. `getAccessToken` is omitted (derived internally). |
| `authGuardConfig` | `AuthGuardConfig` — path protection and redirect callbacks. `isAuthenticated` is omitted (derived internally). |

**Returns:**

| Property | Type | Description |
|---|---|---|
| `useSignin` | `(props?) => { register, formState, onSubmit }` | Sign in form hook |
| `useSignup` | `(props?) => { register, formState, onSubmit }` | Sign up form hook |
| `useLogout` | `() => { logout }` | Logout hook |
| `usePasswordReset` | `(props?) => { register, formState, onSubmit, successMessage }` | Reset password form hook |
| `useRequestPasswordReset` | `(props?) => { register, formState, onSubmit, successMessage }` | Request password reset form hook |
| `useAuthStore` | `UseBoundStore<StoreApi<AuthStore<TUser>>>` | Zustand auth state store |
| `useUserStore` | `UseBoundStore<StoreApi<UserStore<TUser>>>` | Zustand user state store |
| `useAuthService` | `() => IAuthService<TLogin, TRegister>` | Memoized auth service hook |
| `authGuard` | `{ assertAuthenticated, assertNotAuthenticated, enforce }` | Route guard |
| `useAuthRefresh` | `() => void` | Silent token refresh hook |

---

### `createAuthStore`

Creates a Zustand store for authentication state. Used internally by `createAuthClient`. Also available for standalone use.

```typescript
function createAuthStore<TUser extends IUserAccount>(): UseBoundStore<StoreApi<AuthStore<TUser>>>
```

**`AuthStore<TUser>` shape:**

| Field | Type | Description |
|---|---|---|
| `accessToken` | `string \| null` | The current JWT access token |
| `isLoggedIn` | `boolean` | Derived from `!!accessToken` |
| `hasRefreshed` | `boolean` | Set to `true` after first `setAccessToken` call. Prevents refresh loops. |
| `roles` | `TUser["roles"]` | Roles decoded from the JWT payload |
| `roleChecker` | `ReturnType<RoleChecker<TUser>>` | Fluent role checker — `.add(role).passes()` |
| `setAccessToken(token)` | `(token: string \| null) => void` | Sets token, derives `isLoggedIn`, decodes roles, sets `hasRefreshed = true` |
| `getAccessToken()` | `() => string \| null` | Synchronous token getter |
| `logout()` | `() => void` | Clears `accessToken` and `isLoggedIn`. Does **not** reset `hasRefreshed`. |

**State transitions:**

```
Initial:     { accessToken: null,     isLoggedIn: false, hasRefreshed: false }
setAccessToken(token): { accessToken: token, isLoggedIn: true,  hasRefreshed: true  }
setAccessToken(null):  { accessToken: null,  isLoggedIn: false, hasRefreshed: true  }
logout():              { accessToken: null,  isLoggedIn: false, hasRefreshed: true  }
```

---

### `createAuthService`

Creates an HTTP auth service. Used internally by `createAuthClient`. Also available for standalone use.

```typescript
function createAuthService<TLogin extends object, TRegister extends object>(
  options: AuthServiceOptions
): IAuthService<TLogin, TRegister>
```

**`IAuthService<TLogin, TRegister>` interface:**

| Method | Signature | Description |
|---|---|---|
| `login` | `(payload: TLogin) => Promise<string>` | POSTs to login endpoint. Returns `accessToken`. |
| `register` | `(payload: TRegister) => Promise<string>` | POSTs/PUTs to register endpoint. Returns `accessToken`. |
| `logout` | `() => Promise<void>` | Calls logout endpoint. |
| `refresh` | `() => Promise<string>` | Calls refresh endpoint (sends httpOnly cookie). Returns `accessToken`. |
| `requestPasswordReset` | `(email: string) => Promise<TPasswordResetResponse>` | Sends reset request email. Throws `ForbiddenError` if endpoint not configured. |
| `resetPassword` | `(payload: TResetPassword) => Promise<TPasswordResetResponse>` | Resets password with token. Throws `ForbiddenError` if endpoint not configured. |

All requests use `withCredentials: true` and attach the current access token as a `Bearer` authorization header.

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

| Method | Description |
|---|---|
| `assertAuthenticated(pathname, runtime?)` | If pathname starts with any protected path and user is NOT authenticated, calls `onUnauthenticated`. |
| `assertNotAuthenticated(pathname, runtime?)` | If pathname starts with any auth path and user IS authenticated, calls `onAuthenticated`. |
| `enforce(pathname, runtime?)` | Runs `assertNotAuthenticated` first, then `assertAuthenticated`. |

The `runtime` parameter defaults to `"client"`. When `"server"`, uses `isAuthenticatedServer` if provided.

Path matching uses `startsWith` — `/profile` matches `/profile/settings`.

---

### `createUseAuth`

Factory that creates auth form hooks. Used internally by `createAuthClient`. Available for standalone use if you need custom composition.

```typescript
function createUseAuth<TUser, TLogin, TRegister>(
  useAuthStore,
  useUserStore,
  useAuthService,
): {
  useSignin,
  useSignup,
  useLogout,
  usePasswordReset,
  useRequestPasswordReset,
}
```

#### `useSignin`

```typescript
useSignin(props?: { resolver?: Resolver<TLogin> }): {
  register: UseFormRegister<TLogin>;
  formState: FormState<TLogin>;
  onSubmit: (e: FormEvent) => void;
}
```

Integrates with `react-hook-form`. On successful login, sets the access token and decodes the user. On error, sets `formState.errors.root`.

#### `useSignup`

```typescript
useSignup(props?: { resolver?: Resolver<TRegister> }): {
  register: UseFormRegister<TRegister>;
  formState: FormState<TRegister>;
  onSubmit: (e: FormEvent) => void;
}
```

Same pattern as `useSignin` but calls `authService.register`.

#### `useLogout`

```typescript
useLogout(): {
  logout: () => Promise<void>;
}
```

Calls `authService.logout()`. On success, clears the access token and user. Errors are silently ignored.

#### `usePasswordReset`

```typescript
usePasswordReset(props?: { resolver?: Resolver<TResetPassword> }): {
  register: UseFormRegister<TResetPassword>;
  formState: FormState<TResetPassword>;
  onSubmit: (e: FormEvent) => void;
  successMessage: string | null;
}
```

Form hook for resetting a password with a token. Displays `successMessage` on success.

#### `useRequestPasswordReset`

```typescript
useRequestPasswordReset(props?: { resolver?: Resolver<{ email: string }> }): {
  register: UseFormRegister<{ email: string }>;
  formState: FormState<{ email: string }>;
  onSubmit: (e: FormEvent) => void;
  successMessage: string | null;
}
```

Form hook for requesting a password reset email. Displays `successMessage` on success.

---

### `createUseAuthRefresh`

Factory that creates the silent token refresh hook.

```typescript
function createUseAuthRefresh<TUser, TLogin, TRegister>(
  useAuthStore,
  useUserStore,
  useAuthService,
): () => void
```

The returned hook, when called in a component:

1. Checks `isLoggedIn` and `hasRefreshed` from the auth store
2. If not logged in AND not yet refreshed, calls `authService.refresh()`
3. On success, sets the access token and decodes the user
4. On failure, silently continues (user remains logged out)
5. `hasRefreshed` is set to `true` on the first `setAccessToken` call, preventing retry loops

---

### `createUseAuthService`

Factory that creates a memoized auth service hook.

```typescript
function createUseAuthService<TUser, TLogin, TRegister>(
  useAuthStore,
  options: Omit<AuthServiceOptions, "getAccessToken">,
): () => IAuthService<TLogin, TRegister>
```

The returned hook creates the auth service once (memoized) with the current `getAccessToken` reference from the store.

---

## Exported Types

### `IUserAccount`

The base user type. Your `TUser` must extend this.

```typescript
type IUserAccount<Roles extends readonly string[] = readonly string[]> = {
  roles: [...("admin" | "user"), ...Roles];
};
```

All users have `"admin"` and `"user"` as base roles. Extend with your own:

```typescript
type AppUser = {
  id: string;
  email: string;
  name: string;
  roles: ("admin" | "user" | "moderator")[];
};
```

### `AuthState`

```typescript
type AuthState = {
  accessToken: string | null;
  isLoggedIn: boolean;
  hasRefreshed: boolean;
};
```

### `AuthActions`

```typescript
type AuthActions<TUser extends IUserAccount> = {
  setAccessToken: (accessToken: string | null) => void;
  getAccessToken: () => string | null;
  logout: () => void;
  roles: TUser["roles"];
  roleChecker: ReturnType<RoleChecker<TUser>>;
};
```

### `AuthStore`

```typescript
type AuthStore<TUser extends IUserAccount> = AuthState & AuthActions<TUser>;
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
    requestPasswordReset?: {
      method: "post";
      url: string;
      resetPageDetails: { url: string; queryName: string };
    };
    resetPassword?: { method: "post"; url: string };
  };
  getAccessToken?: () => string | null;
};
```

### `IAuthService`

```typescript
interface IAuthService<TLogin extends object, TRegister extends object> {
  login(payload: TLogin): Promise<string>;
  register(payload: TRegister): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<string>;
  requestPasswordReset(email: string): Promise<TPasswordResetResponse>;
  resetPassword(payload: TResetPassword): Promise<TPasswordResetResponse>;
}
```

### `TResetPassword`

```typescript
type TResetPassword = {
  password: string;
  confirmPassword: string;
  token: string;
};
```

### `TPasswordResetResponse`

```typescript
type TPasswordResetResponse = {
  success: boolean;
  message: string;
  error: boolean;
};
```

## Usage Examples

### Sign In

```tsx
import { useSignin } from "./auth";

function SignInPage() {
  const { register, formState, onSubmit } = useSignin();

  return (
    <form onSubmit={onSubmit}>
      <input
        {...register("email", { required: "Email is required" })}
        placeholder="Email"
      />
      {formState.errors.email && (
        <span>{formState.errors.email.message}</span>
      )}

      <input
        {...register("password", { required: "Password is required" })}
        type="password"
        placeholder="Password"
      />
      {formState.errors.password && (
        <span>{formState.errors.password.message}</span>
      )}

      {formState.errors.root && (
        <div className="error">{formState.errors.root.message}</div>
      )}

      <button type="submit" disabled={formState.isSubmitting}>
        Sign In
      </button>
    </form>
  );
}
```

### Sign Up

```tsx
import { useSignup } from "./auth";

function SignUpPage() {
  const { register, formState, onSubmit } = useSignup();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} type="password" placeholder="Password" />

      {formState.errors.root && (
        <div className="error">{formState.errors.root.message}</div>
      )}

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Logout

```tsx
import { useLogout } from "./auth";

function LogoutButton() {
  const { logout } = useLogout();
  return <button onClick={logout}>Log Out</button>;
}
```

### Forgot Password

Request a password reset email:

```tsx
import { useRequestPasswordReset } from "./auth";

function ForgotPasswordPage() {
  const { register, formState, onSubmit, successMessage } =
    useRequestPasswordReset();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} placeholder="Email" />

      {formState.errors.root && (
        <div className="error">{formState.errors.root.message}</div>
      )}

      {successMessage && <div className="success">{successMessage}</div>}

      <button type="submit">Send Reset Link</button>
    </form>
  );
}
```

### Reset Password

```tsx
import { usePasswordReset } from "./auth";

function ResetPasswordPage() {
  const { register, formState, onSubmit, successMessage } =
    usePasswordReset();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("token")} type="hidden" />
      <input
        {...register("password", { required: true })}
        type="password"
        placeholder="New password"
      />
      <input
        {...register("confirmPassword", { required: true })}
        type="password"
        placeholder="Confirm password"
      />

      {formState.errors.root && (
        <div className="error">{formState.errors.root.message}</div>
      )}

      {successMessage && <div className="success">{successMessage}</div>}

      <button type="submit">Reset Password</button>
    </form>
  );
}
```

### Token Refresh

Add to your root component to silently refresh on mount:

```tsx
import { useAuthRefresh } from "./auth";

function App() {
  useAuthRefresh();
  return <RouterProvider router={router} />;
}
```

### Route Protection

Use `authGuard` in your router:

```typescript
// Client-side
router.beforeEach(async (to) => {
  await authGuard.enforce(to.fullPath);
});

// Server-side (SSR)
await authGuard.assertAuthenticated(pathname, "server");
```

### Accessing Auth State

In components (reactive via Zustand selectors):

```tsx
import { useAuthStore, useUserStore } from "./auth";

function UserProfile() {
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn || !user) return <p>Please log in</p>;
  return <h1>Welcome, {user.name}</h1>;
}
```

Outside of components (imperative):

```typescript
import { useAuthStore, useUserStore } from "./auth";

const token = useAuthStore.getState().accessToken;
const isLoggedIn = useAuthStore.getState().isLoggedIn;
const user = useUserStore.getState().getUser();
useUserStore.getState().updateUser("name", "New Name");
```

### Role-Based Access Control

The auth store provides a `roleChecker` with a fluent API:

```tsx
import { useAuthStore } from "./auth";

function AdminPanel() {
  const roleChecker = useAuthStore((s) => s.roleChecker);
  const roles = useAuthStore((s) => s.roles);

  const isAdmin = roleChecker.add("admin").passes();
  const isModerator = roleChecker.add("moderator").passes();

  if (!isAdmin && !isModerator) return <p>Access denied</p>;

  return <div>Admin content</div>;
}
```

The `roleChecker` checks whether the user's decoded JWT roles include **all** of the roles added via `.add()`. Chain multiple `.add()` calls to require multiple roles.

### Custom Validation (Zod)

Pass a Zod resolver to any form hook:

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignInPage() {
  const { register, formState, onSubmit } = useSignin({
    resolver: zodResolver(loginSchema),
  });
  // ...
}
```

### Using the Auth Service Directly

For actions beyond the built-in hooks:

```typescript
function ProfilePage() {
  const authService = useAuthService();

  const handlePasswordResetRequest = async () => {
    await authService.requestPasswordReset("user@example.com");
  };

  const handlePasswordReset = async (token: string) => {
    await authService.resetPassword({
      password: "newpass",
      confirmPassword: "newpass",
      token,
    });
  };
}
```

## Design Philosophy

### What problems does this solve?

`@tindanzor/auth-client` handles the authentication infrastructure that every frontend application needs: storing tokens, decoding JWTs, making authenticated requests, protecting routes, and managing login/logout state. It eliminates the need to wire these pieces together manually.

### Factory pattern

Every component is created via a `create*` factory function with generic type parameters. This gives you compile-time type safety from form inputs through JWT decoding to store state — without React Context or global singletons.

### Dual-store architecture

Auth state and user state live in separate Zustand stores:

- **Auth Store** — `accessToken`, `isLoggedIn`, `hasRefreshed`, `roles`, `roleChecker`. Source of truth for authentication status.
- **User Store** — The decoded JWT payload (minus standard claims). Populated from the access token.

This separation means both stores are independently testable and have clear responsibilities.

### Cookie-based refresh

All HTTP requests use `withCredentials: true`. The access token lives in Zustand state (in-memory). The refresh token lives in an httpOnly cookie (set by the server, not accessible to JavaScript). This is the standard secure pattern.

### Scope

This package contains **only** authentication infrastructure. If a module would still exist without authentication (e.g., a data fetching library, a UI component library), it does not belong here. The consuming application is responsible for:

- Routing and navigation
- UI components and styling
- Server-side logic and database access
- JWT signing and verification (server-side only)
- CSRF protection

## Security

- **JWT verification is server-side only.** `decodeUserFromToken` decodes the payload for display purposes. It does **not** verify the signature.
- **Access token in memory only.** Not persisted to `localStorage` or `sessionStorage`. Survives re-renders but is lost on full page reload (which triggers a refresh attempt).
- **Refresh token in httpOnly cookie.** Never accessible to JavaScript. Ensure your server sets `SameSite` appropriately and uses `secure: true` in production.
- **`hasRefreshed` prevents refresh loops.** Once set to `true` (on first `setAccessToken` call), the refresh hook will not retry. The page must remount to reset this flag.

## Best Practices

- **Use `createAuthClient` as the single entry point** for most applications. It ensures all pieces share the same store instances.
- **Call `useAuthRefresh` early** in your root component to minimize the window between mount and authentication state resolution.
- **Use Zustand selectors** when subscribing to store state to avoid unnecessary re-renders:
  ```tsx
  // Good — re-renders only when user changes
  const user = useUserStore((s) => s.user);

  // Bad — re-renders on any store change
  const { user } = useUserStore();
  ```
- **Display `formState.errors.root`** in all form components — this is where server-side errors appear.
- **Create the auth client once** at module level. Do not call `createAuthClient` inside a component.
- **`hasRefreshed` does not reset on logout.** After a manual logout, the refresh hook will not attempt another refresh. The page must be remounted.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Refresh hook runs infinitely | `hasRefreshed` not being set | Ensure `setAccessToken` is called (not just `refresh`) — `hasRefreshed` is set inside `setAccessToken` |
| Redirect loop on auth pages | `authPaths` and `protectedPaths` overlap | Ensure no path appears in both arrays |
| `ForbiddenError` on password reset | `requestPasswordReset` or `resetPassword` endpoint not configured | Add the endpoint to `AuthServiceOptions.endpoints` |
| User is `null` after login | JWT payload doesn't contain expected claims | Verify your server includes custom claims (e.g., `name`, `email`) in the JWT payload |
| Role checker always returns false | User type doesn't include the role in `roles` array | Ensure `TUser["roles"]` includes your custom roles (e.g., `"moderator"`) |
| Token not sent on requests | `getAccessToken` not wired | When using `createAuthClient`, this is automatic. When using `createAuthService` standalone, provide `getAccessToken` |

## Documentation

| Topic | Description |
|---|---|
| [Architecture](./docs/architecture.md) | Design philosophy, module diagram, data flow |
| [Getting Started](./docs/getting-started.md) | Prerequisites, installation, setup guide |
| [Package Structure](./docs/package-structure.md) | Directory tree, module responsibilities |
| [Public API](./docs/public-api.md) | Exported functions, types, and their usage |
| [Common Workflows](./docs/common-workflows.md) | End-to-end usage examples |
| [Extending](./docs/extending.md) | Custom user models, adding endpoints |
| [Best Practices](./docs/best-practices.md) | Patterns, pitfalls, performance tips |
| [Reference](./docs/reference.md) | Types, config options, defaults |
