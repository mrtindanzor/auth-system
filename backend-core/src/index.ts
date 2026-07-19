import type { ISigninProps, ISignupProps } from "./auth/auth.contracts.types";
import { AuthService } from "./auth/auth.service";
import type { AuthSecretsConfig } from "./config";
import type {
	IUserAccount,
	IUserRepository,
} from "./user/user.contracts.types";
import { UserService } from "./user/user.service";
import { getBearerToken } from "./utils/getBearerToken";

export type { IAuthService } from "./auth/auth.contracts.types";
export { AuthService } from "./auth/auth.service";
export type { AuthSecretsConfig } from "./config";
export { createAuthConfig } from "./config";
export type {
	AuthCookieOptions,
	ClearCookieResult,
	SetCookieResult,
} from "./cookie";
export {
	clearAuthCookie,
	createAuthCookie,
} from "./cookie";
export {
	AppError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./errors";
export type {
	IUserAccount,
	IUserService,
} from "./user/user.contracts.types";
export type { IUserRepository };

export type AuthenticationServiceProps<TUser extends IUserAccount> = {
	userRepo: IUserRepository<TUser>;
	secretsConfig: AuthSecretsConfig;
};

export function createAuthenticationService<
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
		getBearerToken,
	};
}
