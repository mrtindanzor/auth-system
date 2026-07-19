# `@tindanzor/auth-server`

Authentication framework for Node.js backend applications. Provides JWT management, bcrypt password hashing, cookie-based refresh tokens, and a complete auth service with signin, signup, password reset, and registration access flows.

## Installation

```bash
pnpm add @tindanzor/auth-server
```

Dependencies: `bcrypt` (^6), `jose` (^5).

## Quick Setup

```typescript
import { createAuthConfig, createAuthenticationService } from "@tindanzor/auth-server";

const secretsConfig = createAuthConfig({
  accessTokenSecret: process.env.ACCESS_SECRET!,
  refreshTokenSecret: process.env.REFRESH_SECRET!,
  registrationSecret: process.env.REGISTRATION_SECRET!,
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET!,
});

const { authService, userService, getBearerToken } = createAuthenticationService({
  userRepo: myUserRepository,
  secretsConfig,
});

// Sign in
const tokens = await authService.signin({ email: "user@example.com", password: "pass" });
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
