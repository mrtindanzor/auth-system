# Getting Started

## Prerequisites

- **Node.js** 18+ (ES2020 target)
- **TypeScript** (recommended for full type safety)

## Installation

```bash
pnpm add @tindanzor/auth-server
```

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `bcrypt` | ^6.0.0 | Password hashing |
| `jose` | ^5.0.0 | JWT signing, verification, and decoding |

## Basic Setup

### 1. Implement `IUserRepository`

The library requires a user repository that implements the `IUserRepository` interface. This is the only integration point with your database:

```typescript
import type { IUserRepository } from "@tindanzor/auth-server";

type MyUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  roles: ("admin" | "user")[];
};

class MyUserRepository implements IUserRepository<MyUser> {
  async findByEmail(email: string): Promise<MyUser | null> {
    return await db.users.findOne({ email });
  }

  async findByEmailOrPhone({ email, phone }: { email?: string; phone?: string }): Promise<MyUser | null> {
    return await db.users.findOne({ $or: [{ email }, { phone }] });
  }

  async findOne(key: string, value: string): Promise<MyUser | null> {
    return await db.users.findOne({ [key]: value });
  }

  async findById(id: string): Promise<MyUser | null> {
    return await db.users.findById(id);
  }

  async save(data: Record<string, unknown>): Promise<MyUser> {
    return await db.users.create(data);
  }

  async updateOneById(id: string, data: Partial<MyUser>): Promise<MyUser | null> {
    return await db.users.findByIdAndUpdate(id, data, { new: true });
  }
}
```

### 2. Create the Auth Configuration

```typescript
import { createAuthConfig } from "@tindanzor/auth-server";

const secretsConfig = createAuthConfig({
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  registrationSecret: process.env.REGISTRATION_SECRET!,
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET!,
});
```

### 3. Create the Authentication Service

```typescript
import { createAuthenticationService } from "@tindanzor/auth-server";

const { authService, userService, getBearerToken } = createAuthenticationService({
  userRepo: new MyUserRepository(),
  secretsConfig,
});
```

### 4. Use It in Your Routes

```typescript
// Sign in
const tokens = await authService.signin({ email: "user@example.com", password: "pass" });
// tokens.accessToken — JWT string
// tokens.refreshToken — JWT string

// Verify access token
const user = await authService.verifyAuthToken(tokens.accessToken, "access", ["user"]);

// Get user from refresh cookie
const userFromCookie = await authService.getClientFromCookie(bearerToken, ["user"]);

// Logout (clear cookie on client side)
const clearCookie = clearAuthCookie({ name: "refresh" });
```

## What Your Server Must Handle

The library provides authentication logic and data structures. Your server is responsible for:

1. **Extracting the Bearer token** from the `Authorization` header (use `getBearerToken`)
2. **Setting the refresh token as an httpOnly cookie** (use `createAuthCookie`)
3. **Clearing the cookie on logout** (use `clearAuthCookie`)
4. **Calling the appropriate `authService` methods** in your route handlers

The library does **not** provide HTTP middleware, route handlers, or any framework-specific code.

## Environment Variables

You need four secret strings. Generate them with a secure random generator:

```
ACCESS_TOKEN_SECRET=your-access-secret-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
REGISTRATION_SECRET=your-registration-secret-min-32-chars
PASSWORD_RESET_SECRET=your-password-reset-secret-min-32-chars
```

## Next Steps

- [Architecture](./architecture.md) — Understand the design and data flow
- [Public API](./public-api.md) — Full reference for all exports
- [Common Workflows](./common-workflows.md) — Complete usage examples
