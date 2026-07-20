# Common Workflows

## Initial Setup

Set up the auth service once when your application starts:

```typescript
// auth.ts
import { createAuthConfig, createAuthenticationService } from "@tindanzor/auth-server";
import { MyUserRepository } from "./repositories/user";

const secretsConfig = createAuthConfig({
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  registrationSecret: process.env.REGISTRATION_SECRET!,
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET!,
});

export const { authService, userService, getBearerToken, cookieUtils } = createAuthenticationService({
  userRepo: new MyUserRepository(),
  secretsConfig,
  cookieConfig: {
    name: "auth",
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});
```

## Sign-In

Authenticate a user and return tokens:

```typescript
const tokens = await authService.signin({
  email: "user@example.com",
  password: "mypassword",
});

// tokens.accessToken — used in Authorization header
// tokens.refreshToken — set as httpOnly cookie
```

The sign-in supports multiple lookup strategies based on the props provided:

```typescript
// By email
await authService.signin({ email: "user@example.com", password: "pass" });

// By phone
await authService.signin({ phone: "+1234567890", password: "pass" });

// By username
await authService.signin({ username: "johndoe", password: "pass" });

// By email + phone
await authService.signin({ email: "user@example.com", phone: "+1234567890", password: "pass" });
```

## Sign-Up

Register a new user:

```typescript
const tokens = await authService.signup({
  email: "newuser@example.com",
  name: "John Doe",
  password: "securepassword",
});
```

The signup automatically:
1. Checks for uniqueness (email, phone, or username)
2. Hashes the password with bcrypt (10 salt rounds)
3. Saves the user via the repository
4. Returns access + refresh tokens

## Setting the Refresh Token Cookie

Use `cookieUtils.setCookie` (returned by `createAuthenticationService`) to set the refresh token as an httpOnly cookie:

```typescript
// In your route handler
const tokens = await authService.signin({ email, password });

res.cookie(cookieUtils.setCookie.name, tokens.refreshToken, cookieUtils.setCookie.options);
res.json({ accessToken: tokens.accessToken });
```

## Clearing the Cookie on Logout

```typescript
// In your logout route handler
await authService.signout(tokens.refreshToken); // if you have a signout method

res.clearCookie(cookieUtils.clearCookie.name, cookieUtils.clearCookie.options);
res.status(200).json({ message: "Logged out" });
```

## Verifying Tokens

### Verify Access Token (Returns Full User)

```typescript
const user = await authService.verifyAuthToken(accessToken, "access", ["user"]);

if (!user) {
  return res.status(401).json({ error: "Invalid token" });
}

// user is the full TUserAccount object
console.log(user.email, user.roles);
```

### Verify Refresh Token (Returns User ID)

```typescript
const result = await authService.verifyAuthToken(refreshToken, "refresh", ["user"]);

if (!result) {
  return res.status(401).json({ error: "Invalid refresh token" });
}

// result.userId — look up the full user
const user = await userService.findById(result.userId);
```

### Get User from Cookie

A convenience method that verifies the refresh token and looks up the user:

```typescript
const user = await authService.getClientFromCookie(bearerToken, ["user"]);

if (!user) {
  return res.status(401).json({ error: "Not authenticated" });
}
```

## Password Reset Flow

### Step 1: Request Password Reset

```typescript
// In your "request reset" route
const resetToken = await authService.requestPasswordReset("user@example.com");

if (resetToken) {
  // Send email with reset link
  await sendEmail({
    to: "user@example.com",
    subject: "Password Reset",
    body: `https://example.com/reset?token=${resetToken}`,
  });
}

// Always return success to prevent email enumeration
res.json({ message: "If an account exists, you will receive an email" });
```

### Step 2: Reset Password

```typescript
// In your "reset password" route
const { token, password } = req.body;

const updatedUser = await authService.resetPassword(password, token);

if (!updatedUser) {
  return res.status(400).json({ error: "Invalid or expired reset link" });
}

res.json({ message: "Password updated" });
```

The reset token is automatically invalidated when the password changes because the token's signing secret is derived from the user's password hash.

## Registration Access URL

For invite-only registration or admin-created accounts:

```typescript
// Admin generates a registration link
const accessUrl = await authService.getRegistrationAccessUrl("https://example.com/register");
// Returns: "https://example.com/register?access=eyJhbG..."

// User clicks the link, fills in the form, submits
const tokens = await authService.protectedSignup(accessUrl.split("?access=")[1], {
  email: "invited@example.com",
  name: "Invited User",
  password: "securepassword",
});
```

The registration access token is valid for 10 minutes and is automatically invalidated once the account is created.

## Extracting Bearer Token

```typescript
import { getBearerToken } from "@tindanzor/auth-server";

// From Authorization header
const authHeader = req.headers.authorization; // "Bearer eyJhb..."
const token = getBearerToken(authHeader);     // "eyJhb..."

// null or missing header returns ""
const token = getBearerToken(null);  // ""
```

## Complete Express-Like Route Handler

```typescript
import { getBearerToken } from "@tindanzor/auth-server";
import { authService, cookieUtils } from "./auth";

async function loginHandler(req, res) {
  const { email, password } = req.body;

  const tokens = await authService.signin({ email, password });

  res.cookie(cookieUtils.setCookie.name, tokens.refreshToken, cookieUtils.setCookie.options);
  res.json({ accessToken: tokens.accessToken });
}

async function logoutHandler(req, res) {
  res.clearCookie(cookieUtils.clearCookie.name, cookieUtils.clearCookie.options);
  res.json({ message: "Logged out" });
}

async function profileHandler(req, res) {
  const bearer = getBearerToken(req.headers.authorization);
  const user = await authService.getClientFromBearer(bearer, ["user"]);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({ user: { id: user.id, email: user.email, name: user.name } });
}
```
