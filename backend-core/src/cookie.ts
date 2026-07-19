export type AuthCookieOptions = {
	signed: boolean;
	path: string;
	httpOnly: boolean;
	domain?: string | undefined;
	secure: boolean;
	sameSite: "none" | "lax" | "strict";
	maxAge: number;
};

export type SetCookieResult = {
	name: string;
	value: string;
	options: AuthCookieOptions;
};

export type ClearCookieResult = {
	name: string;
	options: Pick<AuthCookieOptions, "signed" | "path" | "httpOnly">;
};

type AuthCookieConfg = {
	token: string;
	name?: string;
	isProduction: boolean;
	baseDomain: string;
	path?: string;
	maxAgeInMins?: number;
};
export function createAuthCookie({
	token,
	name = "auth",
	isProduction,
	baseDomain,
	path = "/",
	maxAgeInMins = 4320,
}: AuthCookieConfg): SetCookieResult {
	const MAX_AGE = maxAgeInMins * 60 * 1000;

	return {
		name,
		value: token,
		options: {
			signed: false,
			path,
			httpOnly: true,
			domain: isProduction ? `.${baseDomain}` : undefined,
			secure: isProduction,
			sameSite: isProduction ? "none" : "lax",
			maxAge: MAX_AGE,
		},
	};
}

type ClearAuthCookieConfig = {
	name?: string;
	path?: string;
};
export function clearAuthCookie({
	name = "auth",
	path = "/",
}: ClearAuthCookieConfig): ClearCookieResult {
	return {
		name,
		options: {
			signed: false,
			path,
			httpOnly: true,
		},
	};
}
