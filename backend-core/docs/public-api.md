# Public API

This page documents all exports from `@tindanzor/auth-server`.

## Functions

### `createAuthenticationService`

The primary entry point. Wires together a `UserService` and `AuthService`, and returns both along with a Bearer token extraction utility and cookie utilities.

```typescript
function createAuthenticationService<
  TUser extends IUserAccount,
  TSignupProps extends ISignupProps<TUser>,
  TSigninProps extends ISigninProps,
>(props: AuthenticationServiceProps<TUser>): {
  userService: UserService<TUser>;
  authService: AuthService<TUser, TSignupProps, TSigninProps>;
  getBearerToken: (bearer: string | null) => string;
  cookieUtils: {
    setCookie: SetCookieResult;
    clearCookie: ClearCookieResult;
  };
}
```

**Type Parameters:**

| Parameter | Description |
|---|---|
| `TUser` | Your user model (must extend `IUserAccount`) |
| `TSignupProps` | Registration payload type (must extend `ISignupProps<TUser>`) |
| `TSigninProps` | Login payload type (must extend `ISigninProps`) |

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `userRepo` | `IUserRepository<TUser>` | Your repository implementation |
| `secretsConfig` | `AuthSecretsConfig` | Created by `createAuthConfig` |
| `cookieConfig` | `AuthCookieConfig` | Cookie configuration (name, maxAge, secure, sameSite, etc.) |

**Example:**

```typescript
import { createAuthenticationService } from "@tindanzor/auth-server";

const { authService, userService, getBearerToken, cookieUtils } = createAuthenticationService({
  userRepo: new MyUserRepository(),
  secretsConfig,
  cookieConfig: {
    name: "auth",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});
```

---

### `createAuthConfig`

Creates a `AuthSecretsConfig` from four secret strings. Converts strings to `Uint8Array` and creates dynamic secret derivation functions for registration and password reset.

```typescript
function createAuthConfig(secrets: {
  refreshTokenSecret: string;
  accessTokenSecret: string;
  registrationSecret: string;
  passwordResetSecret: string;
}): AuthSecretsConfig
```

**Returns:**

| Field | Type | Description |
|---|---|---|
| `refreshSecret` | `Uint8Array` | Static secret for refresh tokens |
| `accessSecret` | `Uint8Array` | Static secret for access tokens |
| `getRegistrationSecret(text)` | `(text: string) => Uint8Array` | Dynamic: encodes `text + registrationSecret` |
| `getPasswordResetToken(text)` | `(text: string) => Uint8Array` | Dynamic: encodes `text + passwordResetSecret` |

**Example:**

```typescript
import { createAuthConfig } from "@tindanzor/auth-server";

const config = createAuthConfig({
  accessTokenSecret: process.env.ACCESS_SECRET!,
  refreshTokenSecret: process.env.REFRESH_SECRET!,
  registrationSecret: process.env.REGISTRATION_SECRET!,
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET!,
});

// Static secrets for access/refresh tokens
config.accessSecret;  // Uint8Array

// Dynamic secrets for per-user tokens
config.getPasswordResetToken(user.password);  // Uint8Array
config.getRegistrationSecret(skeleton.password);  // Uint8Array
```

---

### `createAuthCookie`

Creates a data structure for setting a refresh token as an httpOnly cookie. Returns a `SetCookieResult` — your application applies it to the HTTP response.

```typescript
function createAuthCookie(config: AuthCookieConfig & Partial<Omit<SetCookieResult["options"], "maxAge">>): SetCookieResult
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `"auth"` | Cookie name |
| `maxAgeInMins` | `number` | `4320` (3 days) | Cookie lifetime in minutes |
| `signed` | `boolean` | `false` | Whether the cookie is signed |
| `secure` | `boolean` | `true` | Whether the cookie requires HTTPS |
| `path` | `string` | `"/"` | Cookie path |
| `httpOnly` | `boolean` | `true` | Whether the cookie is httpOnly |
| `domain` | `string` | `undefined` | Cookie domain (prefixed with `.` if set) |
| `sameSite` | `"none" \| "lax" \| "strict"` | `"none"` | SameSite attribute |

**Returns:** `{ name, options }` where `options` includes `httpOnly`, `secure`, `sameSite`, `maxAge`, `domain`, `path`, `signed`.

**Example:**

```typescript
import { createAuthCookie } from "@tindanzor/auth-server";

const cookie = createAuthCookie({
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  domain: "example.com",
});

// Apply to your response (framework-specific)
res.cookie(cookie.name, refreshToken, cookie.options);
```

---

### `cookieUtils`

Returned by `createAuthenticationService`, provides pre-configured cookie utilities based on the `cookieConfig` passed during initialization.

```typescript
cookieUtils.setCookie: SetCookieResult   // { name, options } for setting the cookie
cookieUtils.clearCookie: ClearCookieResult // { name, options } for clearing the cookie
```

**Example:**

```typescript
const { cookieUtils } = createAuthenticationService({ userRepo, secretsConfig, cookieConfig });

// Set cookie
res.cookie(cookieUtils.setCookie.name, refreshToken, cookieUtils.setCookie.options);

// Clear cookie (on logout)
res.clearCookie(cookieUtils.clearCookie.name, cookieUtils.clearCookie.options);
```

---

## Classes

### `AuthService`

The core authentication service. Handles JWT operations, user authentication, and password management.

```typescript
class AuthService<
  TUserAccount extends IUserAccount,
  TSignupProps extends ISignupProps<TUserAccount>,
  TSigninProps extends ISigninProps,
> implements IAuthService
```

**Constructor:** `new AuthService(userService: IUserService<TUserAccount>, config: AuthSecretsConfig)`

**Public Methods:**

| Method | Signature | Description |
|---|---|---|
| `signin` | `(details: TSigninProps) => Promise<AllAuthTokens>` | Authenticates user by email/phone/username. Returns access + refresh tokens. |
| `signup` | `(details: TSignupProps) => Promise<AllAuthTokens>` | Creates new user with hashed password. Checks uniqueness. Returns tokens. |
| `requestPasswordReset` | `(email: string) => Promise<string \| null>` | Generates a 10-minute reset token. Returns null if no user found. |
| `resetPassword` | `(password: string, access: string) => Promise<TUser \| null>` | Validates reset token against current password hash, then updates password. |
| `getRegistrationAccessUrl` | `(url: string) => Promise<string>` | Creates a skeleton account and returns `{url}?access={token}` (10-min expiry). |
| `protectedSignup` | `(access: string, details: TSignupProps) => Promise<AllAuthTokens>` | Validates registration access token, then delegates to `signup`. |
| `getClientFromCookie` | `(authorization: string, role: AuthRoles<TUser["roles"]>) => Promise<TUser \| null>` | Verifies refresh token, then looks up full user. |
| `verifyAuthToken` | Overloaded | Verifies and decodes token. Returns user for `"access"`, or `{ userId, roles }` for `"refresh"`. Returns `null` on failure. |
| `getAuthTokens` | `(payload, role) => Promise<AllAuthTokens>` | Signs access (1-day) and refresh (3-day) token pair. |
| `getToken` | `(payload, exp, secret) => Promise<string>` | Low-level JWT signing with HS256. |

**Example:**

```typescript
// Sign in
const tokens = await authService.signin({ email: "user@example.com", password: "pass" });

// Verify access token
const user = await authService.verifyAuthToken(tokens.accessToken, "access", ["user"]);

// Request password reset
const resetToken = await authService.requestPasswordReset("user@example.com");

// Reset password
const updatedUser = await authService.resetPassword("newpassword123", resetToken);

// Get user from refresh cookie
const user = await authService.getClientFromCookie(bearerToken, ["user"]);
```

---

## Error Classes

Exported directly from `@tindanzor/auth-server`:

| Class | `status` | Default Message | Description |
|---|---|---|---|
| `AppError` | 500 | Custom | Base error class. Extend for custom errors. |
| `NotFoundError` | 404 | `"Not Found"` | User or resource not found |
| `ForbiddenError` | 403 | `"Forbidden"` | Invalid credentials, duplicate account, unconfigured endpoint |
| `UnauthorizedError` | 401 | `"Unauthorized"` | Invalid or expired token |
| `ValidationError` | 400 | `"Invalid input"` | Password mismatch, invalid auth mode |

**Not exported:** `RateLimitExceededError` (429) is used internally and is not part of the public API.

All error classes extend `Error` and include a `status` number property and a `name` string property.

**Example:**

```typescript
import { ForbiddenError, UnauthorizedError } from "@tindanzor/auth-server";

try {
  await authService.signin({ email, password });
} catch (error) {
  if (error instanceof ForbiddenError) {
    // Invalid credentials or duplicate account
  } else if (error instanceof UnauthorizedError) {
    // Invalid token
  }
}
```

---

## Types

### `AuthenticationServiceProps`

```typescript
type AuthenticationServiceProps<TUser extends IUserAccount> = {
  userRepo: IUserRepository<TUser>;
  secretsConfig: AuthSecretsConfig;
  cookieConfig: AuthCookieConfig;
};
```

### `AuthSecretsConfig`

```typescript
type AuthSecretsConfig = {
  refreshSecret: Uint8Array;
  accessSecret: Uint8Array;
  getRegistrationSecret: (text: string) => Uint8Array;
  getPasswordResetToken: (text: string) => Uint8Array;
};
```

### `IAuthService`

```typescript
interface IAuthService<TUser extends IUserAccount = IUserAccount> {
  signin(details: ISigninProps): Promise<AllAuthTokens>;
  signup(details: ISignupProps<TUser>): Promise<AllAuthTokens>;
  protectedSignup(access: string, details: ISignupProps<TUser>): Promise<AllAuthTokens>;
  requestPasswordReset(email: string): Promise<string | null>;
  resetPassword(password: string, access: string): Promise<TUser | null>;
  getRegistrationAccessUrl(url: string): Promise<string>;
  getClientFromCookie(authorization: string, role: AuthRoles<TUser["roles"]>): Promise<TUser | null>;
  verifyAuthToken(token: string, type: "refresh", roles: AuthRoles<TUser["roles"]>): Promise<{ userId: string } | null>;
  verifyAuthToken(token: string, type: "access", roles: AuthRoles<TUser["roles"]>): Promise<TUser | null>;
  getAuthTokens<U extends { id: string; password?: string }>(payload: U, role: AuthRoles<TUser["roles"]>): Promise<AllAuthTokens>;
  getToken<U extends Record<string, unknown>>(payload: U, exp: string, secret: Uint8Array): Promise<string>;
  roles: RoleChecker<TUser>;
}
```

### `IUserAccount`

```typescript
type IUserAccount = (
  | { id: string; name?: string; email?: string; password: string }
  | { id: string; name?: string; username?: string; password: string }
  | { id: string; name?: string; email?: string; username?: string; password: string }
) & {
  roles: ("admin" | "user")[];
};
```

A user must have `id`, `password`, and `roles`. They may have `email`, `username`, or both.

### `IUserRepository`

```typescript
type IUserRepository<TUser extends IUserAccount = IUserAccount> = {
  findByEmailOrPhone(props: { email?: string; phone?: string }): Promise<TUser | null>;
  findByEmail(email: string): Promise<TUser | null>;
  findOne(key: keyof TUser & string, data: string): Promise<TUser | null>;
  findById(id: string): Promise<TUser | null>;
  save(data: Record<string, unknown>): Promise<TUser>;
  updateOneById(id: string, data: Partial<TUser>): Promise<TUser | null>;
};
```

### `IUserService`

```typescript
interface IUserService<TUser extends IUserAccount = IUserAccount> {
  findByEmailOrPhone(props: { email?: string; phone?: string }): Promise<TUser | null>;
  findByEmail(email: string): Promise<TUser | null>;
  findOne(key: keyof TUser & string, data: string): Promise<TUser | null>;
  findById(id: string): Promise<TUser | null>;
  save(data: Record<string, unknown>): Promise<TUser>;
  updateOneById(id: string, data: Partial<TUser>): Promise<TUser | null>;
}
```

### Cookie Types

```typescript
type AuthCookieOptions = {
  signed: boolean;
  path: string;
  httpOnly: boolean;
  domain?: string | undefined;
  secure: boolean;
  sameSite: "none" | "lax" | "strict";
  maxAge: number;
};

type AuthCookieConfig = {
  name?: string;
  maxAgeInMins?: number;
} & Partial<Omit<SetCookieResult["options"], "maxAge">>;

type SetCookieResult = {
  name: string;
  options: AuthCookieOptions;
};

type ClearCookieResult = {
  name: string;
  options: Omit<AuthCookieOptions, "maxAge" | "sameSite">;
};
```

### Auth Token Types

```typescript
type AuthToken = { accessToken: string };
type AllAuthTokens = AuthToken & { refreshToken: string };
```

### Sign-In / Sign-Up Props

```typescript
type ISigninProps =
  | { email: string; password: string }
  | { username: string; password: string }
  | { phone: string; password: string };

type ISignupProps<TUser extends Omit<IUserAccount, "id">> = TUser & ISigninProps;
```
