# Package Structure

```
backend-core/
├── src/
│   ├── index.ts                    # Main entry point — public API exports + createAuthenticationService
│   ├── config.ts                   # createAuthConfig — JWT secret encoding
│   ├── cookie.ts                   # createAuthCookie — cookie config helper
│   ├── errors.ts                   # Error class hierarchy (internal)
│   │
│   ├── auth/                       # Core authentication logic
│   │   ├── auth.service.ts         # AuthService class — JWT, signin, signup, password reset
│   │   └── auth.contracts.types.ts # IAuthService, ISigninProps, ISignupProps, token types
│   │
│   ├── user/                       # User service and contracts
│   │   ├── user.service.ts         # UserService — pass-through facade over IUserRepository
│   │   ├── user.contracts.types.ts # IUserAccount, IUserRepository, IUserService
│   │   └── rules.ts               # Validation assertions (internal)
│   │
│   └── utils/                      # Shared utilities (internal)
│       ├── tryCatch.ts             # tryCatch, syncTryCatch — error handling helpers
│       └── getBearerToken.ts       # Bearer token extraction from Authorization header
│
├── docs/                           # This documentation
├── package.json
└── tsconfig.json
```

## Module Responsibilities

### `index.ts` — Entry Point & Factory

The main entry point does two things:
1. **Re-exports** types and classes from internal modules (making them part of the public API)
2. **Defines and exports** `createAuthenticationService` — the top-level factory that wires `UserService` and `AuthService` together, and returns `cookieUtils` (pre-configured set/clear cookie data structures)

### `config.ts` — Secret Configuration

Creates an `AuthSecretsConfig` from four plain-text secret strings. The access and refresh secrets are static `Uint8Array` values. The registration and password reset secrets are **dynamic** — they are functions that take a text parameter (e.g., a password hash) and concatenate it with the base secret before encoding. This creates per-user derived secrets.

### `cookie.ts` — Cookie Helpers

Framework-agnostic helpers that return data structures for setting httpOnly cookies. They do **not** interact with any HTTP response directly — your application applies the returned data to its own response mechanism.

- `createAuthCookie` — Returns `{ name, options }` for setting a refresh token cookie

### `errors.ts` — Error Hierarchy

Defines the error classes used by `AuthService`. The following are exported from the package: `AppError`, `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError`. `RateLimitExceededError` is internal-only. The hierarchy is:

```
AppError (500)
├── NotFoundError (404)
├── ForbiddenError (403)
├── UnauthorizedError (401)
├── ValidationError (400)
└── RateLimitExceededError (429)
```

### `auth/auth.service.ts` — Auth Service

The core of the package. `AuthService` is a generic class that handles:

- **Sign-in** with multi-strategy user lookup (email, phone, username, email+phone)
- **Sign-up** with uniqueness validation and bcrypt password hashing
- **Password reset** with per-user derived secret invalidation
- **Token generation** (access + refresh pair)
- **Token verification** (with role checking)
- **Registration access URLs** (skeleton account + time-limited token)

### `auth/auth.contracts.types.ts` — Type Definitions

Defines the interfaces and types for the auth module:
- `IAuthService` — The full auth service interface
- `ISigninProps` — Discriminated union for login (email/phone/username + password)
- `ISignupProps<TUser>` — Registration payload type
- `AllAuthTokens` — `{ accessToken, refreshToken }`
- `AuthRoles<Roles>` — Generic role type extending `("admin" | "user")[]`

### `user/user.service.ts` — User Service

A thin pass-through facade that delegates every method to `IUserRepository`. Its purpose is to provide an interface boundary between `AuthService` and the data layer.

### `user/user.contracts.types.ts` — User Types

Defines the core user-related interfaces:
- `IUserAccount` — The base user type (discriminated union of email/username variants)
- `IUserRepository<TUser>` — The repository interface your application must implement
- `IUserService<TUser>` — The service interface (same shape as repository, but as an interface)

### `user/rules.ts` — Validation Rules (Internal)

Two assertion functions used by `AuthService`:
- `assertUserExists` — Throws `ForbiddenError` if user is null
- `assertUniqueNewAccount` — Throws `ForbiddenError` if an account already exists

### `utils/tryCatch.ts` — Error Handling (Internal)

Provides result-type error handling (discriminated union, not tuple-based):
- `tryCatch(promise)` — Returns `{ success: true, data }` or `{ success: false, error }`
- `syncTryCatch(callback)` — Same pattern for synchronous operations

### `utils/getBearerToken.ts` — Token Extraction

Extracts the token portion from an `"Authorization: Bearer <token>"` header string. Returns `""` if input is null.
