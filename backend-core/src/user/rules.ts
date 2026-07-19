import { ForbiddenError } from "../errors";
import type { IUserAccount } from "./user.contracts.types";

export function assertUserExists<T extends IUserAccount>(user: T | null): T {
	if (!user) throw new ForbiddenError("Invalid credentials");
	return user;
}

export function assertUniqueNewAccount(
	user: IUserAccount | null,
	fieldName: string,
): void {
	if (user)
		throw new ForbiddenError(`A user with this ${fieldName} already exists.`);
}
