# `@tindanzor/auth-client`

Authentication framework for React frontend applications. Provides auth store, JWT decode, login/register/logout/refresh hooks, route guards, user store, and an auth API client.

## Installation

```bash
pnpm add @tindanzor/auth-client
```

Peer dependencies: `react` (^19), `react-dom` (^19), `axios` (^1), `react-hook-form` (^7.80).

## Quick Setup

```typescript
import { createAuthClient } from "@tindanzor/auth-client";

export const { useSignin, useSignup, useLogout, useAuthRefresh, authGuard } =
  createAuthClient<AppUser, LoginPayload, RegisterPayload>(
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
