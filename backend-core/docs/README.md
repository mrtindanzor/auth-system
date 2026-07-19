# @tindanzor/auth-server

> Authentication framework for Node.js backend applications.

## What Is This?

`@tindanzor/auth-server` is a type-safe, framework-agnostic authentication library for Node.js backends. It provides JWT management (signing, verification, decoding), password hashing with bcrypt, cookie-based refresh token handling, and a complete auth service with signin, signup, password reset, and registration access flows.

The library follows **dependency inversion** — it depends on an `IUserRepository` interface that your application implements, making it database-agnostic. It is **not** tied to Express or any HTTP framework.

## When to Use This

- You need authentication infrastructure for a Node.js backend
- You want a complete auth service (signin, signup, password reset, token verification)
- You need JWT signing and verification with configurable secrets
- You want httpOnly cookie helpers for refresh tokens
- You prefer a composable, factory-based API over middleware monoliths

## Quick Start

```bash
pnpm add @tindanzor/auth-server
```

```typescript
import { createAuthConfig, createAuthenticationService } from "@tindanzor/auth-server";

const config = createAuthConfig({
  accessTokenSecret: "your-access-secret",
  refreshTokenSecret: "your-refresh-secret",
  registrationSecret: "your-registration-secret",
  passwordResetSecret: "your-password-reset-secret",
});

const { authService, userService, getBearerToken } = createAuthenticationService({
  userRepo: myUserRepository,
  secretsConfig: config,
});

// Sign in
const tokens = await authService.signin({ email: "user@example.com", password: "pass" });

// Verify a token
const user = await authService.verifyAuthToken(token, "access", ["user"]);
```

## Documentation

| Topic | Description |
|---|---|
| [Architecture](./docs/architecture.md) | Design philosophy, module diagram, data flow |
| [Getting Started](./docs/getting-started.md) | Prerequisites, installation, setup guide |
| [Package Structure](./docs/package-structure.md) | Directory tree, module responsibilities |
| [Public API](./docs/public-api.md) | Exported functions, types, classes, and their usage |
| [Common Workflows](./docs/common-workflows.md) | End-to-end usage examples |
| [Extending](./docs/extending.md) | Implementing IUserRepository, custom user models |
| [Best Practices](./docs/best-practices.md) | Patterns, pitfalls, security considerations |
| [Reference](./docs/reference.md) | Types, config options, defaults |
