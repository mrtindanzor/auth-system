# Common Workflows

## Initial Setup

Set up the auth client once at the top level of your application:

```typescript
// auth.ts
import { createAuthClient } from "@tindanzor/auth-client";

type AppUser = { id: string; name: string; email: string };
type LoginPayload = { email: string; password: string };
type RegisterPayload = { name: string; email: string; password: string };

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
    onUnauthenticated: (path) => router.push(`/signin?next=${path}`),
    onAuthenticated: () => router.push("/"),
  },
);
```

## App Root with Token Refresh

Add `useAuthRefresh` to your root component. This attempts a silent refresh on mount if the user is not logged in:

```tsx
import { useAuthRefresh } from "./auth";

function App() {
  useAuthRefresh();

  return <RouterProvider router={router} />;
}
```

## Login Page with Form Validation

Use `useSignin` for a complete login form with `react-hook-form` integration:

```tsx
import { useSignin } from "./auth";

function SignInPage() {
  const { register, formState, onSubmit } = useSignin();

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input
          {...register("email", { required: "Email is required" })}
          placeholder="Email"
        />
        {formState.errors.email && (
          <span className="error">{formState.errors.email.message}</span>
        )}
      </div>

      <div>
        <input
          {...register("password", { required: "Password is required" })}
          type="password"
          placeholder="Password"
        />
        {formState.errors.password && (
          <span className="error">{formState.errors.password.message}</span>
        )}
      </div>

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

### With Zod Validation

Pass a Zod resolver for schema-based validation:

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

  // ... rest of the form
}
```

## Registration Page

Use `useSignup` — it works identically to `useSignin` but with the registration payload type:

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

## Logout Button

```tsx
import { useLogout } from "./auth";

function LogoutButton() {
  const { logout } = useLogout();

  return <button onClick={logout}>Log Out</button>;
}
```

## Protected Page with Route Guard

Use `authGuard` in your router to protect routes:

```typescript
// router.ts
import { authGuard } from "./auth";

async function routeGuard(pathname: string) {
  await authGuard.enforce(pathname);
}

// In your router (framework-specific)
router.beforeEach(async (to) => {
  await routeGuard(to.fullPath);
});
```

### Server-Side Route Protection (SSR)

If you provide `isAuthenticatedServer`, you can use it for server-side rendering:

```typescript
// In SSR context
await authGuard.assertAuthenticated(pathname, "server");
```

## Accessing Auth State Directly

Read auth or user state outside of React components:

```typescript
import { useAuthStore, useUserStore } from "./auth";

// Get current access token
const token = useAuthStore.getState().accessToken;

// Check if logged in
const isLoggedIn = useAuthStore.getState().isLoggedIn;

// Get decoded user
const user = useUserStore.getState().getUser();

// Update a user field
useUserStore.getState().updateUser("name", "New Name");
```

## Reading Auth State in Components

Subscribe to store changes in React components using Zustand selectors:

```tsx
function UserProfile() {
  const user = useUserStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn || !user) return <p>Please log in</p>;

  return <h1>Welcome, {user.name}</h1>;
}
```

## Using the Auth Service Directly

For actions not covered by the hooks (e.g., password reset):

```typescript
const authService = useAuthService();

// Request password reset
await authService.requestPasswordReset?.({ email: "user@example.com" });

// Reset password
await authService.resetPassword?.({ token: "...", password: "newpass" });
```

## Using the Auth Axios Client

For making authenticated requests to non-auth API endpoints:

```typescript
import { createAuthAxiosClient } from "@tindanzor/auth-client";

const api = createAuthAxiosClient({
  baseUrl: "https://api.example.com",
  getAccessToken: () => useAuthStore.getState().accessToken,
});

// All requests will include the Authorization header
const response = await api.get("/api/profile");
```

Note: The token is captured at creation time by `createAuthAxiosClient`. For requests that need a fresh token, consider using `axios` directly with the auth store's `getAccessToken`.

## Password Reset Flow

With the optional password reset endpoints configured:

```typescript
// Request password reset email
const authService = useAuthService();
await authService.requestPasswordReset?.({ email: "user@example.com" });

// User clicks link in email, lands on reset page
function ResetPasswordPage() {
  const authService = useAuthService();
  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (data: { password: string }) => {
    await authService.resetPassword?.({ password: data.password, token });
    router.push("/signin");
  };

  // ... form JSX
}
```

## Complete App Integration

Here is a full example of how all pieces fit together in a typical React app:

```typescript
// auth.ts — Single setup file
import { createAuthClient } from "@tindanzor/auth-client";

type AppUser = { id: string; name: string; email: string };

export const {
  useAuthStore,
  useUserStore,
  useSignin,
  useSignup,
  useLogout,
  useAuthRefresh,
  authGuard,
} = createAuthClient<AppUser, { email: string; password: string }, { email: string; name: string; password: string }>(
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
    authPaths: ["/signin", "/signup"],
    onUnauthenticated: (path) => router.push(`/signin?next=${path}`),
    onAuthenticated: () => router.push("/"),
  },
);
```

```tsx
// App.tsx
import { useAuthRefresh } from "./auth";

function App() {
  useAuthRefresh();
  return <RouterProvider router={router} />;
}
```

```tsx
// SignInPage.tsx
import { useSignin } from "./auth";

function SignInPage() {
  const { register, formState, onSubmit } = useSignin();

  return (
    <form onSubmit={onSubmit}>
      <input {...register("email")} placeholder="Email" />
      <input {...register("password")} type="password" placeholder="Password" />
      {formState.errors.root && <p>{formState.errors.root.message}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

```tsx
// DashboardPage.tsx
import { useLogout, useUserStore } from "./auth";

function DashboardPage() {
  const { logout } = useLogout();
  const user = useUserStore((s) => s.user);

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```
