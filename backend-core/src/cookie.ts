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
	options: AuthCookieOptions;
};

export type ClearCookieResult = {
	name: string;
	options: Omit<AuthCookieOptions, "maxAge" | "sameSite">;
};

export type AuthCookieConfig = {
	name?: string;
	maxAgeInMins?: number;
} & Partial<Omit<SetCookieResult["options"], "maxAge">>;

export function createAuthCookie({
	name = "auth",
	maxAgeInMins = 3,
	signed = false,
	secure = true,
	path = "/",
	httpOnly = true,
	domain = undefined,
	sameSite = "none",
}: AuthCookieConfig &
	Partial<Omit<SetCookieResult["options"], "maxAge">>): SetCookieResult {
	const MAX_AGE = maxAgeInMins * 60 * 1000;

	return {
		name,
		options: {
			signed,
			path,
			httpOnly,
			domain: domain ? `.${domain}` : undefined,
			secure,
			sameSite,
			maxAge: MAX_AGE,
		},
	};
}
