import { create } from "zustand";
import type { IUserAccount, RoleChecker } from "../api/types";
import { roleBuilder } from "../utils/auth.roles";

export type AuthState = {
	accessToken: string | null;
	isLoggedIn: boolean;
	hasRefreshed: boolean;
};

export type AuthActions<
	TUser extends IUserAccount,
	TRoles extends TUser["roles"] = TUser["roles"],
> = {
	setAccessToken: (accessToken: string | null) => void;
	getAccessToken: () => string | null;
	logout: () => void;
	setRoles: (roles: TRoles | null) => void;
	roles: TRoles;
	roleChecker: ReturnType<RoleChecker<TUser>>;
};

export type AuthStore<TUser extends IUserAccount> = AuthState &
	AuthActions<TUser>;

export function createAuthStore<TUser extends IUserAccount>() {
	return create<AuthStore<TUser>>((set, get) => ({
		accessToken: null,
		isLoggedIn: false,
		hasRefreshed: false,

		setAccessToken(accessToken) {
			set({
				isLoggedIn: !!accessToken,
				accessToken,
				hasRefreshed: true,
			});
		},

		getAccessToken() {
			return get().accessToken;
		},

		logout() {
			set({
				accessToken: null,
				isLoggedIn: false,
			});
		},
		roles: [],
		setRoles(roles) {
			set({ roles: roles || [] });
		},
		roleChecker: roleBuilder(get().roles, []),
	}));
}
