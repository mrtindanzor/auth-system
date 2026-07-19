import type {
	IUserAccount,
	IUserRepository,
	IUserService,
} from "./user.contracts.types";

export class UserService<TUser extends IUserAccount>
	implements IUserService<TUser>
{
	constructor(private userRepo: IUserRepository<TUser>) {}
	findByEmailOrPhone(props: {
		email?: string;
		phone?: string;
	}): Promise<TUser | null> {
		return this.userRepo.findByEmailOrPhone(props);
	}
	findByEmail(email: string): Promise<TUser | null> {
		return this.userRepo.findByEmail(email);
	}
	findOne(key: keyof TUser & string, data: string): Promise<TUser | null> {
		return this.userRepo.findOne(key, data);
	}
	findById(id: string): Promise<TUser | null> {
		return this.userRepo.findById(id);
	}
	save(data: Record<string, unknown>): Promise<TUser> {
		return this.userRepo.save(data);
	}
	updateOneById(id: string, data: Partial<TUser>): Promise<TUser | null> {
		return this.userRepo.updateOneById(id, data);
	}
}
