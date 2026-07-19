# Best Practices

## Recommended Patterns

### Use `createAuthenticationService` as the Single Entry Point

For most applications, `createAuthenticationService` is the right choice. It wires the repository, user service, and auth service together, ensuring consistent dependency injection.

### Always Set Cookies Framework-Specifically

The library returns data structures for cookies, never sets them directly. This is intentional. Always apply them through your HTTP framework:

```typescript
// Express
const cookie = createAuthCookie({ token, isProduction, baseDomain });
res.cookie(cookie.name, cookie.value, cookie.options);

// Fastify
res.setCookie(cookie.name, cookie.value, cookie.options);

// Hono
res.cookie(cookie.name, cookie.value, cookie.options);
```

### Use `getBearerToken` for Authorization Header Extraction

Don't manually split the header. Use the provided utility:

```typescript
const token = getBearerToken(req.headers.authorization);
// Returns "" if header is null or malformed
```

### Return Generic Responses for Password Reset

Always return the same response whether or not the email exists, to prevent email enumeration:

```typescript
// Good
await authService.requestPasswordReset(email);
res.json({ message: "If an account exists, you will receive an email" });

// Bad — reveals whether the email is registered
const token = await authService.requestPasswordReset(email);
if (!token) return res.status(404).json({ error: "User not found" });
```

### Validate Tokens Before Trusting Them

Always verify tokens before using the data inside them:

```typescript
const user = await authService.verifyAuthToken(token, "access", ["user"]);
if (!user) {
  return res.status(401).json({ error: "Invalid token" });
}
// Now safe to use user data
```

## Common Pitfalls

### Not Using `withCredentials` on the Client

The refresh token is in an httpOnly cookie. If your HTTP client doesn't send cookies, refresh will silently fail. Ensure your client sends `withCredentials: true` (Axios) or `credentials: "include"` (fetch).

### Forgetting to Set `isProduction` Correctly

The `createAuthCookie` helper changes behavior based on `isProduction`:
- In development: no domain restriction, `sameSite: "lax"`, no `secure` flag
- In production: domain-locked, `sameSite: "none"`, `secure: true`

If you set `isProduction: true` without HTTPS, cookies will not be set by browsers.

### Using Weak Secrets

JWT secrets should be cryptographically random and at least 32 characters. Never use:
- Short strings (`"secret"`)
- Dictionary words
- Hardcoded values in source code (use environment variables)

### Not Handling Token Expiry

Access tokens expire after 1 day, refresh tokens after 3 days (configured in `getAuthTokens`). Your client must handle expired tokens gracefully (the frontend package's `useAuthRefresh` handles this automatically).

### Storing Passwords in Tokens

The `getAuthTokens` method automatically strips the `password` field from the payload before signing. Never manually include passwords in token payloads.

## Security Considerations

### Per-User Derived Secrets

Password reset and registration tokens use secrets derived from the user's own data (password hash + base secret). This provides automatic token invalidation:

- **Password reset:** When the user changes their password, the hash changes, invalidating any outstanding reset tokens
- **Registration access:** When the skeleton account is filled in, the password changes, invalidating the access URL

### bcrypt Configuration

The library uses bcrypt with 10 salt rounds. This is a good default for most applications. If you need to adjust the cost factor, you would need to modify the `AuthService` class or fork the package.

### Role Checking

`verifyAuthToken` checks that **all** of the user's roles are included in the required roles array. The `AuthRole` type is `"admin" | "user"`. If a user has roles `["admin", "user"]` and you verify with `["user"]`, it will pass. If a user has `["admin"]` and you verify with `["user"]`, it will fail.

### CORS Configuration

If your frontend and backend are on different origins, ensure your server:
1. Allows the `Authorization` header in CORS
2. Allows credentials (`Access-Control-Allow-Credentials: true`)
3. Sets `Access-Control-Allow-Origin` to your specific frontend origin (not `*`)

### Rate Limiting

The library includes a `RateLimitExceededError` class (internal), suggesting rate limiting is expected at the application layer. Implement rate limiting on:
- `/auth/login` — prevent brute force
- `/auth/request-password-reset` — prevent abuse
- `/auth/register` — prevent spam
