# Best Practices

## Recommended Patterns

### Use `createAuthClient` as the Single Entry Point

For most applications, `createAuthClient` is the right choice. It wires everything together and ensures all pieces share the same store instances. Only use individual factories if you have a specific reason to compose them manually.

### Call `useAuthRefresh` Early

Add `useAuthRefresh()` to your root component or layout. This ensures the token refresh attempt happens as early as possible, preventing unnecessary redirects.

```tsx
function App() {
  useAuthRefresh(); // First thing in the root
  return <RouterProvider router={router} />;
}
```

### Use Zustand Selectors for Subscriptions

Always use selectors when subscribing to store state in components to avoid unnecessary re-renders:

```tsx
// Good — only re-renders when user changes
const user = useUserStore((s) => s.user);

// Bad — re-renders on any store change
const { user } = useUserStore();
```

### Handle Form Errors with `formState.errors.root`

The hooks set server-side errors on the `root` field of `formState.errors`. Always display this:

```tsx
{formState.errors.root && (
  <div className="error">{formState.errors.root.message}</div>
)}
```

### Use Optional Chaining for Optional Methods

`requestPasswordReset` and `resetPassword` are optional on the service interface. Use optional chaining:

```typescript
await authService.requestPasswordReset?.({ email });
await authService.resetPassword?.({ password, token });
```

## Common Pitfalls

### Access Token Snapshot in `createAuthAxiosClient`

`createAuthAxiosClient` captures the token at creation time. If the token changes (e.g., after refresh), the Axios instance will still use the old token. For requests that need the current token, use the auth service directly or read from the store:

```typescript
// The auth service calls getAccessToken() on every request (fresh)
const authService = createAuthService({
  /* ... */
  getAccessToken: () => useAuthStore.getState().accessToken,
});

// Or read directly
const token = useAuthStore.getState().getAccessToken();
```

### `hasRefreshed` Does NOT Reset on Logout

Calling `logout()` clears `accessToken` and `isLoggedIn` but does NOT reset `hasRefreshed`. This is intentional — after a manual logout, the refresh hook should not attempt another refresh. The page must be reloaded (or the app remounted) for `hasRefreshed` to reset.

### Route Guard Path Matching Uses `startsWith`

The auth guard matches paths using `startsWith`, not exact matching. This means:

- `/profile` matches `/profile/settings`
- `/dashboard` matches `/dashboard/analytics`

If you need exact matching, adjust your `protectedPaths` and `authPaths` accordingly.

### `setUser(null)` Does Not Clear `user` in All Cases

`setUser(null)` calls `decodeUserFromToken(null)`, which returns `null`, so it does clear the user. However, `setUser` with a malformed token will also result in `null` (the decode catches errors silently).

## Performance Considerations

### Memoized Auth Service

The `useAuthService` hook (created by `createUseAuthService`) memoizes the service instance with `useMemo`. Since Zustand's `getAccessToken` function reference is stable, the service is effectively created once. This means:

- No new Axios instances on every render
- No unnecessary object creation

### Zustand Over Context

Zustand was chosen over React Context for performance. Zustand subscriptions are granular — a component only re-renders when the selected slice of state changes, not when any part of the auth state changes.

### Avoid Creating Multiple Auth Clients

Each `createAuthClient` call creates its own store instances. Do not call it inside a component or in a way that creates multiple clients. Create it once at the module level and export the results.

## Security Considerations

### JWT Verification is Server-Side Only

The `decodeUserFromToken` utility does **not** verify the JWT signature. It only decodes the payload. All token verification must happen on the server. The client-side decode is for display purposes only (showing the user's name, email, etc.).

### Refresh Token in httpOnly Cookie

The library assumes your server sets the refresh token as an httpOnly cookie. All auth requests use `withCredentials: true` to send this cookie. Never store the refresh token in JavaScript-accessible storage.

### Access Token in Memory Only

The access token lives in Zustand state (in-memory). It is not persisted to `localStorage` or `sessionStorage`. This means:

- The token survives component re-renders (Zustand is in-memory state)
- The token is lost on full page reload (which triggers a refresh attempt)
- The token is not accessible to XSS attacks via `localStorage`

### Protect Against CSRF

Since the refresh token is in a cookie, ensure your server implements CSRF protection (e.g., SameSite cookie attribute, CSRF tokens). The `createAuthCookie` helper sets `sameSite: "lax"` in development and `sameSite: "none"` in production. If using `"none"`, ensure `secure: true` is also set (which the helper does automatically in production).
