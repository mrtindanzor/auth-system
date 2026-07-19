# Extending the Package

## Custom User Models

The library is fully generic over the user type. To use a custom user model, pass it as the first type parameter to `createAuthClient`:

```typescript
type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  avatar?: string;
  preferences: { theme: "light" | "dark" };
};

const { useUserStore } = createAuthClient<AppUser, LoginPayload, RegisterPayload>(/* ... */);

// The user store is now typed as UserStore<AppUser>
const user = useUserStore.getState().getUser();
// user.preferences.theme is fully typed
```

The user type must extend `object`. It will be decoded from the JWT payload — any custom claims you add to the JWT on the server side will be available as user fields (standard JWT claims like `iat`, `exp`, `iss`, `aud`, `sub`, `jti`, `nbf` are automatically stripped).

## Adding Password Reset Endpoints

Password reset is optional. To enable it, add the endpoints to your service configuration and pass the generic types:

```typescript
type ResetPasswordPayload = { token: string; password: string };
type RequestPasswordResetPayload = { email: string };

const { useAuthService } = createAuthClient<
  AppUser,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  RequestPasswordResetPayload
>(
  {
    baseUrl: "https://api.example.com",
    endpoints: {
      login: { method: "post", url: "/auth/login" },
      register: { method: "post", url: "/auth/register" },
      logout: { method: "post", url: "/auth/logout" },
      refresh: { method: "get", url: "/auth/refresh" },
      requestPasswordReset: { method: "post", url: "/auth/request-password-reset" },
      resetPassword: { method: "post", url: "/auth/reset-password" },
    },
  },
  { /* guard config */ },
);
```

Then call them via the auth service:

```typescript
const authService = useAuthService();
await authService.requestPasswordReset?.({ email: "user@example.com" });
await authService.resetPassword?.({ password: "newpass", token: "..." });
```

If the endpoints are not configured, calling these methods throws a `ForbiddenError`.

## Using Individual Building Blocks

If `createAuthClient` doesn't fit your needs, compose the pieces manually:

### Standalone Auth Store

```typescript
import { createAuthStore } from "@tindanzor/auth-client";

const useAuthStore = createAuthStore();
```

### Standalone Auth Service

```typescript
import { createAuthService } from "@tindanzor/auth-client";

const authService = createAuthService({
  baseUrl: "https://api.example.com",
  endpoints: { /* ... */ },
  getAccessToken: () => useAuthStore.getState().accessToken,
});
```

### Standalone Route Guard

```typescript
import { createAuthGuard } from "@tindanzor/auth-client";

const guard = createAuthGuard({
  protectedPaths: ["/admin"],
  authPaths: ["/login"],
  isAuthenticated: () => useAuthStore.getState().isLoggedIn,
  onUnauthenticated: (path) => redirectToLogin(path),
  onAuthenticated: () => redirectToHome(),
});
```

### Manual Hook Composition

If you need custom hook logic, use the internal factories:

```typescript
// These are internal APIs — accessible via deep imports
import { createUseAuthService } from "@tindanzor/auth-client/src/auth/hooks/useAuthService";
import { createUseAuth } from "@tindanzor/auth-client/src/auth/hooks/useAuth";
import { createUseAuthRefresh } from "@tindanzor/auth-client/src/auth/hooks/useAuthRefresh";

const useAuthService = createUseAuthService(useAuthStore, {
  baseUrl: "https://api.example.com",
  endpoints: { /* ... */ },
});

const { useSignin, useSignup, useLogout } = createUseAuth(
  useAuthStore,
  useUserStore,
  useAuthService,
);

const useAuthRefresh = createUseAuthRefresh(
  useAuthStore,
  useUserStore,
  useAuthService,
);
```

## Custom Error Handling

The `fe` utility extracts error messages safely:

```typescript
import { fe } from "@tindanzor/auth-client/src/utils/fe";

try {
  await authService.login(details);
} catch (error) {
  const message = fe(error); // Always returns a string
  showToast(message);
}
```

You can also catch specific error types:

```typescript
import { ForbiddenError } from "@tindanzor/auth-client/src/errors/errors";

try {
  await authService.requestPasswordReset?.({ email });
} catch (error) {
  if (error instanceof ForbiddenError) {
    // Endpoint not configured
  }
}
```

## Custom HTTP Client

Replace the default Axios-based service by implementing the `IAuthService` interface:

```typescript
import type { IAuthService } from "@tindanzor/auth-client";

class MyAuthService implements IAuthService<LoginPayload, RegisterPayload, object, object> {
  async login(payload: LoginPayload) {
    const response = await fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data.accessToken;
  }

  async register(payload: RegisterPayload) { /* ... */ }
  async logout() { /* ... */ }
  async refresh() { /* ... */ }
}
```
