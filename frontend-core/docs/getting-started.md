# Getting Started

## Prerequisites

- **Node.js** 18+ (ES2020 target)
- **React 19** (peer dependency)
- **TypeScript** (recommended for full type safety)

## Installation

```bash
pnpm add @tindanzor/auth-client
```

### Peer Dependencies

These must be installed in your application:

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.0.0 | React framework |
| `react-dom` | ^19.0.0 | React DOM renderer |
| `axios` | ^1.0.0 | HTTP client (used by the auth service) |
| `react-hook-form` | ^7.80.0 | Form handling (used by login/signup hooks) |

## Basic Setup

### 1. Define Your Types

First, define the shapes of your user, login, and registration payloads:

```typescript
type AppUser = {
  id: string;
  name: string;
  email: string;
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

### 2. Create the Auth Client

Call `createAuthClient` with your configuration. This is typically done once, at the top level of your app (e.g., in an `auth.ts` or `config.ts` file):

```typescript
import { createAuthClient } from "@tindanzor/auth-client";

export const {
  useAuthStore,
  useUserStore,
  useAuthService,
  useSignin,
  useSignup,
  useLogout,
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
    protectedPaths: ["/profile", "/dashboard"],
    authPaths: ["/signin", "/signup"],
    onUnauthenticated: (path) => {
      // Redirect to login, preserving the intended destination
      router.push(`/signin?next=${path}`);
    },
    onAuthenticated: () => {
      // Redirect authenticated users away from auth pages
      router.push("/");
    },
  },
);
```

### 3. Add Token Refresh to Your App Root

The `useAuthRefresh` hook attempts a silent token refresh when the app loads. Call it in your root component or layout:

```tsx
function App() {
  useAuthRefresh(); // Attempts refresh on mount if not logged in

  return <RouterProvider router={router} />;
}
```

### 4. Use the Auth Hooks in Components

```tsx
function SignInPage() {
  const { register, formState, onSubmit } = useSignin();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} placeholder="Email" />
      {formState.errors.email && <span>{formState.errors.email.message}</span>}

      <input {...register("password")} type="password" placeholder="Password" />
      {formState.errors.password && <span>{formState.errors.password.message}</span>}

      {formState.errors.root && <span>{formState.errors.root.message}</span>}

      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Configuration Reference

### Auth Service Options

The first argument to `createAuthClient` is an `AuthServiceOptions` object (without `getAccessToken`, which is wired internally):

```typescript
{
  baseUrl: string;            // Base URL for all auth API requests
  endpoints: {
    login: {                  // Required
      method: "post";         // Must be "post"
      url: string;            // e.g., "/auth/login"
    };
    register: {               // Required
      method: "put" | "post"; // POST or PUT
      url: string;
    };
    logout: {                 // Required
      method: "post" | "get"; // POST or GET
      url: string;
    };
    refresh: {                // Required
      method: "get" | "post"; // GET or POST
      url: string;
    };
    requestPasswordReset?: {  // Optional
      method: "post";
      url: string;
    };
    resetPassword?: {         // Optional
      method: "post";
      url: string;
    };
  };
}
```

### Auth Guard Config

The second argument is an `AuthGuardConfig` object (without `isAuthenticated`, which is wired internally):

```typescript
{
  protectedPaths: string[];                    // Paths requiring authentication
  authPaths: string[];                         // Paths only for unauthenticated users
  isAuthenticatedServer?(): Promise<boolean>;  // Optional server-side auth check
  onUnauthenticated: (currentPath: string) => void;  // Redirect callback
  onAuthenticated: (currentPath?: string) => void;   // Redirect callback
}
```

## What the Server Must Return

The auth service expects your API endpoints to return responses with this shape:

```typescript
{
  accessToken: string;    // Required: JWT access token
  refreshToken?: string;  // Optional: JWT refresh token (if returned in body)
  // ... any additional fields are available as AuthApiResponse<T>
}
```

The refresh token is typically set as an httpOnly cookie by the server, not returned in the response body. The `refreshToken` field in the response type is optional for this reason.

## Next Steps

- [Architecture](./architecture.md) — Understand the design and data flow
- [Public API](./public-api.md) — Full reference for all exports
- [Common Workflows](./common-workflows.md) — Complete usage examples
