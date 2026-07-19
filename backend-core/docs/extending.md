# Extending the Package

## Implementing `IUserRepository`

The `IUserRepository` interface is the primary extension point. Your application must implement it to connect the auth library to your database.

```typescript
import type { IUserRepository } from "@tindanzor/auth-server";

type MyUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  roles: ("admin" | "user")[];
};

class MongoUserRepository implements IUserRepository<MyUser> {
  constructor(private collection: Collection<MyUser>) {}

  async findByEmail(email: string): Promise<MyUser | null> {
    return await this.collection.findOne({ email });
  }

  async findByEmailOrPhone({ email, phone }: { email?: string; phone?: string }): Promise<MyUser | null> {
    const query: Record<string, unknown>[] = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    return await this.collection.findOne({ $or: query });
  }

  async findOne(key: string, value: string): Promise<MyUser | null> {
    return await this.collection.findOne({ [key]: value });
  }

  async findById(id: string): Promise<MyUser | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async save(data: Record<string, unknown>): Promise<MyUser> {
    const result = await this.collection.insertOne(data as MyUser);
    return { ...data, id: result.insertedId.toString() } as MyUser;
  }

  async updateOneById(id: string, data: Partial<MyUser>): Promise<MyUser | null> {
    return await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" },
    );
  }
}
```

### Method Contracts

| Method | Called By | Expected Behavior |
|---|---|---|
| `findByEmail(email)` | `signin`, `signup`, `requestPasswordReset` | Return user by email, or null |
| `findByEmailOrPhone(props)` | `signin`, `signup` (when both provided) | Return user matching either, or null |
| `findOne(key, value)` | `signin`, `signup` (phone/username lookup) | Return user by arbitrary field, or null |
| `findById(id)` | `verifyAuthToken`, `getClientFromCookie` | Return user by ID, or null |
| `save(data)` | `signup`, `getRegistrationAccessUrl` | Create a new user, return it with an ID |
| `updateOneById(id, data)` | `resetPassword` | Update user, return updated version or null |

## Custom User Models

Extend `IUserAccount` with additional fields. The user type flows through all auth operations:

```typescript
type MyUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  roles: ("admin" | "user")[];
  // Custom fields
  avatar: string;
  preferences: { theme: "light" | "dark" };
  lastLoginAt: Date;
};

// The AuthService will return MyUser from verifyAuthToken, resetPassword, etc.
const { authService } = createAuthenticationService<MyUser, /* ... */>({
  userRepo: myRepo,
  secretsConfig,
});

const user = await authService.verifyAuthToken(token, "access", ["user"]);
// user.avatar is fully typed
```

## Custom Error Handling

The library throws typed error classes that are exported from the package:

```typescript
import { ForbiddenError, UnauthorizedError, NotFoundError } from "@tindanzor/auth-server";

try {
  await authService.signin({ email, password });
} catch (error) {
  if (error instanceof ForbiddenError) {
    // Invalid credentials or duplicate account
  } else if (error instanceof UnauthorizedError) {
    // Invalid token
  } else if (error instanceof NotFoundError) {
    // User not found
  }
}
```

**Available error classes:** `AppError`, `ForbiddenError`, `NotFoundError`, `UnauthorizedError`, `ValidationError`.

**Note:** `RateLimitExceededError` is not exported from the public API.

## Decorating UserService

Since `UserService` implements `IUserService`, you can wrap it with additional logic:

```typescript
import type { IUserService, IUserAccount } from "@tindanzor/auth-server";

class LoggingUserService<T extends IUserAccount> implements IUserService<T> {
  constructor(private inner: IUserService<T>) {}

  async findByEmail(email: string) {
    console.log(`Looking up user by email: ${email}`);
    return this.inner.findByEmail(email);
  }

  // Delegate all other methods...
  async findById(id: string) { return this.inner.findById(id); }
  async findOne(key: string, value: string) { return this.inner.findOne(key, value); }
  async save(data: Record<string, unknown>) { return this.inner.save(data); }
  async updateOneById(id: string, data: Partial<T>) { return this.inner.updateOneById(id, data); }
  async findByEmailOrPhone(props: { email?: string; phone?: string }) { return this.inner.findByEmailOrPhone(props); }
}
```

## Custom Token Payload

The `getToken` method on `AuthService` accepts any payload:

```typescript
// Add custom claims to a token
const token = await authService.getToken(
  { userId: user.id, customClaim: "value" },
  "1h",
  config.accessSecret,
);
```

## Using `getAuthTokens` Directly

Generate token pairs for any user payload:

```typescript
const tokens = await authService.getAuthTokens(
  { id: user.id, password: user.password, email: user.email },
  user.roles,
);
// tokens.accessToken — 1-day expiry
// tokens.refreshToken — 3-day expiry
```

The `password` field is automatically stripped from the token payload.
