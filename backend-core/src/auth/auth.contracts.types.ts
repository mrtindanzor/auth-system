import type { IUserAccount } from "../user/user.contracts.types";

export type AuthToken = { accessToken: string };
export type AllAuthTokens = AuthToken & { refreshToken: string };
export type AuthRole = "admin" | "user";

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

export type ISignupProps<TUser extends Omit<IUserAccount, "id">> = TUser &
	ISigninProps;

export interface IAuthService<TUser extends IUserAccount = IUserAccount> {
	signin(details: ISigninProps): Promise<AllAuthTokens>;
	signup(details: ISignupProps<TUser>): Promise<AllAuthTokens>;
	protectedSignup(
		access: string,
		details: ISignupProps<TUser>,
	): Promise<AllAuthTokens>;
	requestPasswordReset(email: string): Promise<string | null>;
	resetPassword(password: string, access: string): Promise<TUser | null>;
	getRegistrationAccessUrl(url: string): Promise<string>;
	getClientFromCookie(
		authorization: string,
		role: AuthRole[],
	): Promise<TUser | null>;
	verifyAuthToken(
		token: string,
		type: "refresh",
		roles: AuthRole[],
	): Promise<{ userId: string } | null>;
	verifyAuthToken(
		token: string,
		type: "access",
		roles: AuthRole[],
	): Promise<TUser | null>;
	getAuthTokens<U extends { id: string; password?: string }>(
		payload: U,
		role: AuthRole[],
	): Promise<AllAuthTokens>;
	getToken<U extends Record<string, unknown>>(
		payload: U,
		exp: string,
		secret: Uint8Array,
	): Promise<string>;
}
