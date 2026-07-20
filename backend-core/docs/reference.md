# Reference

## Configuration Options

### `createAuthConfig` Secrets

| Field | Type | Required | Description |
|---|---|---|---|
| `accessTokenSecret` | `string` | Yes | Secret for signing access tokens (1-day expiry) |
| `refreshTokenSecret` | `string` | Yes | Secret for signing refresh tokens (3-day expiry) |
| `registrationSecret` | `string` | Yes | Base secret for registration access tokens (combined with password hash) |
| `passwordResetSecret` | `string` | Yes | Base secret for password reset tokens (combined with password hash) |

### `createAuthCookie` Config

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | No | `"auth"` | Cookie name |
| `maxAgeInMins` | `number` | No | `4320` (3 days) | Cookie lifetime in minutes |
| `signed` | `boolean` | No | `false` | Whether the cookie is signed |
| `secure` | `boolean` | No | `true` | Whether the cookie requires HTTPS |
| `path` | `string` | No | `"/"` | Cookie path |
| `httpOnly` | `boolean` | No | `true` | Whether the cookie is httpOnly |
| `domain` | `string` | No | `undefined` | Cookie domain (prefixed with `.` if set) |
| `sameSite` | `"none" \| "lax" \| "strict"` | No | `"none"` | SameSite attribute |

## Types

### `AuthSecretsConfig`

```typescript
type AuthSecretsConfig = {
  refreshSecret: Uint8Array;
  accessSecret: Uint8Array;
  getRegistrationSecret: (text: string) => Uint8Array;
  getPasswordResetToken: (text: string) => Uint8Array;
};
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

### `IUserRepository<TUser>`

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

### `IUserService<TUser>`

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

### `IAuthService<TUser>`

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

### Token Types

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

### `AuthenticationServiceProps<TUser>`

```typescript
type AuthenticationServiceProps<TUser extends IUserAccount> = {
  userRepo: IUserRepository<TUser>;
  secretsConfig: AuthSecretsConfig;
  cookieConfig: AuthCookieConfig;
};
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

## Error Classes

Exported from `@tindanzor/auth-server`:

| Class | `status` | Default Message | When Thrown |
|---|---|---|---|
| `AppError` | 500 | Custom | Base class. Extend for custom errors. |
| `NotFoundError` | 404 | `"Not Found"` | User not found during password reset |
| `ForbiddenError` | 403 | `"Forbidden"` | Invalid credentials, duplicate account |
| `UnauthorizedError` | 401 | `"Unauthorized"` | Invalid/expired token |
| `ValidationError` | 400 | `"Invalid input"` | Invalid auth mode, password mismatch |

**Not exported:** `RateLimitExceededError` (429, `"Too many requests..."`) is used internally only.

All error classes extend `Error` and include a `status` number property and a `name` string property.

## Defaults

| Item | Default Value | Description |
|---|---|---|
| Access token expiry | `"1d"` | Signed in `getAuthTokens` |
| Refresh token expiry | `"3d"` | Signed in `getAuthTokens` |
| Reset token expiry | `"10m"` | Signed in `requestPasswordReset` |
| Registration token expiry | `"10m"` | Signed in `getRegistrationAccessUrl` |
| bcrypt salt rounds | `10` | Used in `signup` and `resetPassword` |
| Cookie name | `"auth"` | Default for `createAuthCookie` |
| Cookie max age | `4320` minutes (3 days) | Default for `createAuthCookie` |
| Cookie path | `"/"` | Default for `createAuthCookie` |
| Cookie httpOnly | `true` | Always |
| Cookie signed | `false` | Always |

## Implementation Details

### JWT Claim Stripping

`AuthService.verifyToken` strips these standard JWT claims from the payload before returning:

- `aud` (Audience)
- `exp` (Expiration Time)
- `iat` (Issued At)
- `iss` (Issuer)
- `jti` (JWT ID)
- `sub` (Subject)
- `nbf` (Not Before)

The remaining claims are returned as the typed payload. This means your custom claims should not use these names.

### Token Signing Algorithm

All tokens are signed with **HS256** (HMAC-SHA256) via the `jose` library.

### `getAuthTokens` Payload Structure

Access tokens contain:
```json
{
  "userId": "user-id",
  "id": "user-id",
  "email": "user@example.com",
  "role": ["user"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

Refresh tokens contain:
```json
{
  "userId": "user-id",
  "role": ["user"],
  "iat": 1234567890,
  "exp": 1234827090
}
```

### Password Reset Token Invalidation Mechanism

The reset token is signed with `getPasswordResetToken(user.password)`, which concatenates the user's current bcrypt hash with the base password reset secret. When the user changes their password:

1. The new password is hashed with bcrypt
2. The user record is updated with the new hash
3. Any outstanding reset tokens were signed with the **old** hash
4. Verification against the new hash fails, invalidating the token

This provides automatic single-use reset tokens without a revocation database.

### Registration Access Token Invalidation

Same mechanism: the skeleton account has an initial password. `getRegistrationAccessUrl` signs the token with `getRegistrationSecret(skeleton.password)`. When `protectedSignup` calls `signup`, the password is replaced with a hash of the real password, invalidating the access URL.
