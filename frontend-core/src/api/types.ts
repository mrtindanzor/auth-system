export type AuthTokens = {
	accessToken: string;
	refreshToken?: string;
};

export type AuthApiResponse<T> = T & AuthTokens;

type BaseRoles = ("admin" | "user")[];
export type IUserAccount<Roles extends readonly string[] = readonly string[]> =
	{
		roles: [...BaseRoles, ...Roles];
	};

type RoleCheckerRecurse<
	TUser extends IUserAccount<ExtendedRoles>,
	ExtendedRoles extends readonly string[] = readonly string[],
	Roles extends TUser["roles"] = TUser["roles"],
> = {
	add: (role: Roles[number]) => RoleCheckerRecurse<TUser>;
	passes: () => boolean;
};

export type RoleChecker<
	TUser extends IUserAccount<ExtendedRoles>,
	ExtendedRoles extends readonly string[] = readonly string[],
	Roles extends TUser["roles"] = TUser["roles"],
> = (userRoles: Roles) => RoleCheckerRecurse<TUser>;
