import type { IUserAccount } from "../user/user.contracts.types";

export function roleBuilder<
	TUser extends IUserAccount,
	Roles extends TUser["roles"] = TUser["roles"],
>(userRoles: Roles, requiredRoles: Roles[number][]) {
	return {
		add: (role: Roles[number]) => {
			return roleBuilder(userRoles, [...requiredRoles, role]);
		},
		passes: () => requiredRoles.every((role) => userRoles.includes(role)),
	};
}
