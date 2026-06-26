export { UnauthorizedError } from "./errors";

export {
  createAuthAxiosClient,
  attachTokenRefreshInterceptor,
} from "./api";
export type { AuthApiConfig, AuthEndpoints, AuthTokens, AuthApiResponse } from "./api";

export {
  createAuthStore,
  decodeUserFromToken,
  createAuthService,
  createAuthGuard,
  createUseAuthRefresh,
  createUseAuth,
} from "./auth";
export type {
  AuthState,
  AuthActions,
  AuthStore,
  IAuthService,
  AuthServiceOptions,
  AuthGuardConfig,
  UseAuthHandlers,
} from "./auth";

export {
  createUserStore,
  createUserContext,
} from "./user";
export type { UserStore, UserContextValue } from "./user";

export { tryCatch, syncTryCatch, fe } from "./utils";
