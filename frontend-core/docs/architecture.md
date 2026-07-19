# Architecture

## Design Philosophy

`@tindanzor/auth-client` is built on three core principles:

1. **Factory Pattern** — Every component (stores, services, hooks, guards) is created via a factory function. This enables full generic type parameterization, so your user type, login payload, and register payload flow through the entire system with type safety.

2. **Configuration Over Modification** — The library does not provide defaults for secrets, endpoints, or redirect behavior. You supply configuration, and the library wires everything together. There is nothing to override or monkey-patch.

3. **Composability** — While `createAuthClient` provides an all-in-one entry point, every piece can also be used independently. Need just the auth store? Use `createAuthStore`. Need just route guards? Use `createAuthGuard`.

## Module Diagram

```mermaid
graph TB
    subgraph "Public API"
        CAC["createAuthClient"]
    end

    subgraph "Internal Modules"
        CAS["createAuthService"]
        CASstore["createAuthStore"]
        CAUStore["createUserStore"]
        CAG["createAuthGuard"]
        CUAS["createUseAuthService"]
        CUA["createUseAuth"]
        CUAR["createUseAuthRefresh"]
    end

    subgraph "Services"
        AS["AuthService<br/>(HTTP requests)"]
        ST["Zustand Auth Store<br/>(token, login state)"]
        US["Zustand User Store<br/>(decoded user)"]
        RG["Auth Guard<br/>(route protection)"]
    end

    subgraph "Utilities"
        JWT["decodeUserFromToken"]
        TC["tryCatch / syncTryCatch"]
        FE["fe (error formatter)"]
        ERR["AppError / ForbiddenError"]
    end

    CAC --> CASstore
    CAC --> CAUStore
    CAC --> CAG
    CAC --> CUAS
    CAC --> CUA
    CAC --> CUAR

    CUAS --> AS
    CUA --> AS
    CUAR --> AS

    AS --> ST
    AS --> ERR

    CASstore --> ST
    CAUStore --> US
    US --> JWT

    CUA --> TC
    CUA --> FE
    CUAR --> TC

    CAG --> ST
```

## Data Flow

### Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as useSignin Hook
    participant S as AuthService
    participant A as Auth Store
    participant US as User Store

    U->>F: Submits form
    F->>S: authService.login(details)
    S->>S: POST /auth/login (with credentials)
    S-->>F: accessToken
    F->>A: setAccessToken(accessToken)
    F->>US: setUser(accessToken)
    Note over US: Decodes JWT, extracts user fields
    F->>F: Resets form
    F-->>U: Redirect via router
```

### Token Refresh Flow

```mermaid
sequenceDiagram
    participant App as App Mount
    participant H as useAuthRefresh
    participant S as AuthService
    participant A as Auth Store
    participant US as User Store

    App->>H: Component mounts
    H->>A: Check isLoggedIn, hasRefreshed
    alt Not logged in AND not refreshed
        H->>S: authService.refresh()
        S->>S: GET /auth/refresh (with httpOnly cookie)
        S-->>H: accessToken
        H->>A: setAccessToken(accessToken)
        H->>US: setUser(accessToken)
    else Already logged in or already refreshed
        H-->>App: Skip refresh
    end
```

### Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as useLogout Hook
    participant S as AuthService
    participant A as Auth Store
    participant US as User Store

    U->>H: Calls logout()
    H->>S: authService.logout()
    S->>S: POST /auth/logout
    S-->>H: (success)
    H->>A: setAccessToken(null)
    H->>US: setUser(null)
```

## Key Design Decisions

### Dual Store Architecture

Auth state and user state are kept in separate Zustand stores:

- **Auth Store** — Holds `accessToken`, `isLoggedIn`, and `hasRefreshed`. This is the source of truth for authentication status. It does not know about user details.
- **User Store** — Holds the decoded user object (extracted from the JWT payload minus standard claims). It is populated from the access token.

This separation means:
- The auth store is framework-agnostic in concept (token in, boolean out)
- The user store focuses on the decoded JWT payload shape
- Both stores are independently testable

### Generic Type Parameters

The type parameters flow through the entire system:

```
createAuthClient<TUser, TLogin, TRegister, TResetPassword?, TRequestPasswordReset?>
  ├── useAuthStore: AuthStore (always the same shape)
  ├── useUserStore: UserStore<TUser> (your user type)
  ├── useAuthService: IAuthService<TLogin, TRegister, ...>
  ├── useSignin: returns form for TLogin
  ├── useSignup: returns form for TRegister
  └── useAuthRefresh: decodes JWT as TUser
```

This means if your login payload has `{ email: string; password: string }`, the `useSignin` hook will enforce that type on the form, and any errors will be type-checked at compile time.

### Silent Refresh Pattern

`useAuthRefresh` implements the standard "try refresh on mount" pattern:

1. On component mount, check: am I not logged in AND have I not yet attempted a refresh?
2. If both conditions are true, call `authService.refresh()`
3. On success, set the access token and decode the user
4. On failure, silently ignore (the user remains logged out)
5. Set `hasRefreshed = true` regardless of outcome to prevent retry loops

The `hasRefreshed` flag is critical — it lives in the auth store and prevents infinite refresh loops if the refresh endpoint fails.

### Cookie-Based Refresh

All HTTP requests from `AuthService` use `withCredentials: true`. This means:
- The **access token** lives in Zustand state (client-side, JavaScript-accessible)
- The **refresh token** lives in an httpOnly cookie (server-side, not accessible to JavaScript)

This is the standard secure pattern: short-lived access tokens in memory, long-lived refresh tokens in httpOnly cookies.

### Hook Factories

React hooks are created via factory functions (`createUseAuth`, `createUseAuthService`, `createUseAuthRefresh`) that close over store references. This avoids:
- React Context providers and the associated re-render issues
- Prop drilling
- Global singleton stores (each `createAuthClient` call creates its own store instances)

When using `createAuthClient`, these factories are called internally and the resulting hooks are returned ready to use.

## Scope

This library contains **only** authentication infrastructure. If a module would still exist without authentication in the application, it does not belong here.
