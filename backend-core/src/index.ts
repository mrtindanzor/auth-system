import type { ISigninProps, ISignupProps } from "./auth/auth.contracts.types";
import { AuthService } from "./auth/auth.service";
import type { AuthSecretsConfig } from "./config";
import { type AuthCookieConfig, createAuthCookie } from "./cookie";
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
	AuthCookieConfig,
	AuthCookieOptions,
	ClearCookieResult,
	SetCookieResult,
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
	cookieConfig: AuthCookieConfig;
};

export function createAuthenticationService<
	TUser extends IUserAccount,
	TSignupProps extends ISignupProps<TUser>,
	TSigninProps extends ISigninProps,
>({
	userRepo,
	secretsConfig,
	cookieConfig,
}: AuthenticationServiceProps<TUser>) {
	const userService = new UserService<TUser>(userRepo);
	const authService = new AuthService<TUser, TSignupProps, TSigninProps>(
		userService,
		secretsConfig,
	);

	const createdCookieConfig = createAuthCookie(cookieConfig);
	const {
		sameSite: _s,
		maxAge: _m,
		...cookieOptions
	} = createdCookieConfig.options;

	return {
		userService,
		authService,
		getBearerToken,
		cookieUtils: {
			setCookie: createdCookieConfig,
			clearCookie: { name: createdCookieConfig.name, options: cookieOptions },
		},
	};
}
