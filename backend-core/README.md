# backend-core

Authentication framework for backend applications.

Extracted from MyGhMart's authentication system. Provides JWT management, password hashing, cookie-based refresh tokens, and Express auth middleware.

## Scope

This library contains **only** authentication infrastructure.

If a module would still exist without authentication in the application, it does not belong here.

## Architecture

```
Application
  └── backend-core (authentication framework)
        ├── auth/jwt.ts          JWT signing, verification, decoding (jose)
        ├── auth/tokens.ts       Access + refresh token pairs
        ├── auth/cookies.ts      HttpOnly refresh cookie helpers
        ├── auth/password.ts     bcrypt password hasher interface + factory
        ├── auth/middleware.ts    Express middleware (attachUser, requireAuth, requireRole)
        ├── auth/contracts.ts    IUserRepository, IAuthService interfaces
        ├── config/auth.config.ts  Secret encoding utilities
        ├── errors/              UnauthorizedError
        └── utils/               getBearerToken
```

## Usage

### Installation

```bash
pnpm add backend-core
```

Peer dependencies: `express`, `bcrypt`.

### JWT Tokens

```typescript
import { signToken, verifyToken, decodeToken, encodeAuthSecret } from "backend-core";

const secret = encodeAuthSecret("my-access-secret");

// Sign
const token = await signToken({ userId: "123", role: "user" }, secret, "1d");

// Verify
const payload = await verifyToken<{ userId: string; role: string }>(token, secret);

// Decode (no verification)
const data = decodeToken<{ userId: string }>(token);
```

### Token Pairs (Access + Refresh)

```typescript
import { generateTokenPair, encodeAuthSecret } from "backend-core";

const accessSecret = encodeAuthSecret("access-secret");
const refreshSecret = encodeAuthSecret("refresh-secret");

const { accessToken, refreshToken } = await generateTokenPair(
  { id: "123", name: "John", email: "john@example.com" },
  "user",
  { secret: accessSecret, expiresIn: "1d" },
  { secret: refreshSecret, expiresIn: "3d" },
);
```

### Password Hashing (bcrypt)

```typescript
import { createBcryptPasswordHasher } from "backend-core";

const hasher = createBcryptPasswordHasher(10);

const hash = await hasher.hash("my-password");
const match = await hasher.compare("my-password", hash);
```

### Auth Cookies

```typescript
import { createAuthCookieHelpers } from "backend-core";

const cookies = createAuthCookieHelpers({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 3 * 24 * 60 * 60 * 1000,
});

// Set refresh token as httpOnly cookie
cookies.setRefreshToken(refreshToken, res);

// Clear on logout
cookies.clearRefreshToken(res);
```

### Auth Middleware (Express)

```typescript
import { createAuthMiddleware, type ITokenVerifier } from "backend-core";

// Application implements this
const verifier: ITokenVerifier = {
  async verifyAccessToken(token) {
    return verifyToken<{ userId: string; role: "user" | "admin" }>(token, accessSecret);
  },
  async verifyRefreshToken(token) {
    return verifyToken<{ userId: string; role: "user" | "admin" }>(token, refreshSecret);
  },
};

const { attachUser, requireAuth, requireRole } = createAuthMiddleware(verifier);

app.use(attachUser);          // Populates res.locals from Bearer token
app.use("/api", requireAuth); // Blocks unauthenticated requests
app.use("/admin", requireRole("admin")); // Role-based guard
```

### User Repository Contract

```typescript
import type { IUserRepository } from "backend-core";

class MyUserRepo implements IUserRepository<MyUser> {
  async findById(id: string) { /* ... */ }
  async findByEmail(email: string) { /* ... */ }
}
```

## Configuration Over Modification

Applications supply:

- **JWT secrets** (via `encodeAuthSecret`)
- **Token expiry** (via `generateTokenPair` config)
- **Cookie settings** (via `createAuthCookieHelpers`)
- **Token verifier** implementation (via `createAuthMiddleware`)
- **Password hasher** (via `createBcryptPasswordHasher`)
- **User repository** implementation
