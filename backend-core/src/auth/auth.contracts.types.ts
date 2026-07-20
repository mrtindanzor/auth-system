import type { IUserAccount } from "../user/user.contracts.types";

export type AuthToken = { accessToken: string };
export type AllAuthTokens = AuthToken & { refreshToken: string };

type BaseRoles = ("admin" | "user")[];

export type AuthRoles<Roles extends readonly string[] = readonly string[]> = [
	...BaseRoles,
	...Roles,
];

export type ISigninProps =
	| {
			email: string;
			password: string;
	  }
	| {
			username: string;
			password: string;
	  }
	| {
			phone: string;
			password: string;
	  };

type RoleCheckerRecurse<
	TUser extends IUserAccount,
	Roles extends TUser["roles"] = TUser["roles"],
> = {
	add: (role: Roles[number]) => RoleCheckerRecurse<TUser>;
	passes: () => boolean;
};

export type RoleChecker<
	TUser extends IUserAccount,
	Roles extends TUser["roles"] = TUser["roles"],
> = (userRoles: Roles) => RoleCheckerRecurse<TUser, Roles>;

export type ISignupProps<TUser extends Omit<IUserAccount, "id">> = TUser &
	ISigninProps;

export interface IAuthService<TUser extends IUserAccount = IUserAccount> {
	signin(details: ISigninProps): Promise<AllAuthTokens & { user: TUser }>;
	signup(
		details: ISignupProps<TUser>,
	): Promise<AllAuthTokens & { user: TUser }>;
	protectedSignup(
		access: string,
		details: ISignupProps<TUser>,
	): Promise<AllAuthTokens & { user: TUser }>;
	requestPasswordReset(email: string): Promise<string | null>;
	resetPassword(password: string, access: string): Promise<TUser | null>;
	getRegistrationAccessUrl(url: string): Promise<string>;
	getClientFromCookie(
		authorization: string,
		role: AuthRoles<TUser["roles"]>,
	): Promise<TUser | null>;
	verifyAuthToken(
		token: string,
		type: "refresh",
		roles: AuthRoles<TUser["roles"]>,
	): Promise<{ userId: string } | null>;
	verifyAuthToken(
		token: string,
		type: "access",
		roles: AuthRoles<TUser["roles"]>,
	): Promise<TUser | null>;
	getAuthTokens<U extends { id: string; password?: string }>(
		payload: U,
		role: AuthRoles<TUser["roles"]>,
	): Promise<AllAuthTokens>;
	getToken<U extends Record<string, unknown>>(
		payload: U,
		exp: string,
		secret: Uint8Array,
	): Promise<string>;
	roles: RoleChecker<TUser>;
}
