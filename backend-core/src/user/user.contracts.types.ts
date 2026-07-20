type BaseRoles = ("admin" | "user")[];

export type IUserAccount<Roles extends readonly string[] = readonly string[]> =
	(
		| {
				id: string;
				name?: string;
				email?: string;
				password: string;
		  }
		| {
				id: string;
				name?: string;
				username?: string;
				password: string;
		  }
		| {
				id: string;
				name?: string;
				email?: string;
				username?: string;
				password: string;
		  }
	) & {
		roles: [...BaseRoles, ...Roles];
	};

export type IUserRepository<TUser extends IUserAccount = IUserAccount> = {
	findByEmailOrPhone(props: {
		email?: string;
		phone?: string;
	}): Promise<TUser | null>;
	findByEmail(email: string): Promise<TUser | null>;
	findOne(key: keyof TUser & string, data: string): Promise<TUser | null>;
	findById(id: string): Promise<TUser | null>;
	save(data: Record<string, unknown>): Promise<TUser>;
	updateOneById(id: string, data: Partial<TUser>): Promise<TUser | null>;
};

export interface IUserService<TUser extends IUserAccount = IUserAccount> {
	findByEmailOrPhone(props: {
		email?: string;
		phone?: string;
	}): Promise<TUser | null>;
	findByEmail(email: string): Promise<TUser | null>;
	findOne(key: keyof TUser & string, data: string): Promise<TUser | null>;
	findById(id: string): Promise<TUser | null>;
	save(data: Record<string, unknown>): Promise<TUser>;
	updateOneById(id: string, data: Partial<TUser>): Promise<TUser | null>;
}
