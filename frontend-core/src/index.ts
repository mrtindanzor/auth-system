import {
  createUseAuth,
  createUseAuthRefresh,
  createUseAuthService,
} from "./auth";
import { AuthGuardConfig, createAuthGuard } from "./auth/middleware";
import { AuthServiceOptions } from "./auth/service";
import { createAuthStore } from "./auth/store";
import { createUserStore } from "./user";

export { createAuthGuard } from "./auth/middleware";
export type { AuthGuardConfig } from "./auth/middleware";
export { createAuthService } from "./auth/service";
export type { AuthServiceOptions, IAuthService } from "./auth/service";
export { createAuthStore } from "./auth/store";
export type { AuthActions, AuthState, AuthStore } from "./auth/store";
export { decodeUserFromToken } from "./auth/tokens";

export function createAuthClient<
  TUser extends object,
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object = object,
  TRequestPasswordReset extends object = object,
>(
  options: Omit<AuthServiceOptions, "getAccessToken">,
  authGuardConfig: AuthGuardConfig,
) {
  const authGuard = createAuthGuard(authGuardConfig);
  const useAuthStore = createAuthStore();
  const useUserStore = createUserStore<TUser>();
  const useAuthService = createUseAuthService<
    TLogin,
    TRegister,
    TResetPassword,
    TRequestPasswordReset
  >(useAuthStore, options);
  const useAuth = createUseAuth(useAuthStore, useUserStore, useAuthService);
  const useAuthRefresh = createUseAuthRefresh(
    useAuthStore,
    useUserStore,
    useAuthService,
  );

  return {
    useAuthStore,
    useAuthService,
    useUserStore,
    useAuth,
    authGuard,
    useAuthRefresh,
  };
}
