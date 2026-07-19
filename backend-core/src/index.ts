import type { ISigninProps, ISignupProps } from "./auth/auth.contracts.types";
import { AuthService } from "./auth/auth.service";
import type { AuthSecretsConfig } from "./config";
import type {
  IUserAccount,
  IUserRepository,
} from "./user/user.contracts.types";
import { UserService } from "./user/user.service";

export type { IAuthService } from "./auth/auth.contracts.types";
export { AuthService } from "./auth/auth.service";
export { createAuthConfig } from "./config";
export type { AuthSecretsConfig } from "./config";
export {
  clearAuthCookie,
  createAuthCookie,
} from "./cookie";
export type {
  AuthCookieOptions,
  ClearCookieResult,
  SetCookieResult,
} from "./cookie";
export type {
  IUserAccount,
  IUserService,
} from "./user/user.contracts.types";

export { getBearerToken } from "./utils/getBearerToken";
export { syncTryCatch, tryCatch } from "./utils/tryCatch";

export type AuthenticationServiceProps<TUser extends IUserAccount> = {
  userRepo: IUserRepository<TUser>;
  secretsConfig: AuthSecretsConfig;
};

function createAuthenticationService<
  TUser extends IUserAccount,
  TSignupProps extends ISignupProps<TUser>,
  TSigninProps extends ISigninProps,
>({ userRepo, secretsConfig }: AuthenticationServiceProps<TUser>) {
  const userService = new UserService<TUser>(userRepo);
  const authService = new AuthService<TUser, TSignupProps, TSigninProps>(
    userService,
    secretsConfig,
  );

  return {
    userService,
    authService,
  };
}
