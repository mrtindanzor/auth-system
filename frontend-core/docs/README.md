# @tindanzor/auth-client

> Authentication framework for React frontend applications.

## What Is This?

`@tindanzor/auth-client` is a type-safe, hook-based authentication library for React 19 applications. It provides everything needed to implement authentication in a frontend: state management, JWT decoding, HTTP auth services, form hooks, route guards, and automatic token refresh.

The library follows a **factory pattern** — every component is created via a factory function with generic type parameters, giving you full type safety from form inputs to JWT payloads to store state.

## When to Use This

- You need authentication in a React application
- You want pre-built login/register/logout flows with `react-hook-form` integration
- You need route protection (client-side and server-side)
- You want automatic silent token refresh on app load
- You prefer a composable, factory-based API over a monolithic auth provider

## Quick Start

```bash
pnpm add @tindanzor/auth-client
```

Peer dependencies: `react` (^19), `react-dom` (^19), `axios` (^1), `react-hook-form` (^7.80).

```typescript
import { createAuthClient } from "@tindanzor/auth-client";

const {
  useSignin,
  useSignup,
  useLogout,
  useAuthRefresh,
  useAuthStore,
  useUserStore,
  authGuard,
} = createAuthClient<{ id: string; email: string }, { email: string; password: string }, { email: string; name: string; password: string }>(
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

## Documentation

| Topic | Description |
|---|---|
| [Architecture](./architecture.md) | Design philosophy, module diagram, data flow |
| [Getting Started](./getting-started.md) | Prerequisites, installation, setup guide |
| [Package Structure](./package-structure.md) | Directory tree, module responsibilities |
| [Public API](./public-api.md) | Exported functions, types, and their usage |
| [Common Workflows](./common-workflows.md) | End-to-end usage examples |
| [Extending](./extending.md) | Custom user models, adding endpoints |
| [Best Practices](./best-practices.md) | Patterns, pitfalls, performance tips |
| [Reference](./reference.md) | Types, config options, defaults |
