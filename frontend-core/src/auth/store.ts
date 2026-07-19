import { create } from "zustand";

export type AuthState = {
	accessToken: string | null;
	isLoggedIn: boolean;
	hasRefreshed: boolean;
};

export type AuthActions = {
	setAccessToken: (accessToken: string | null) => void;
	getAccessToken: () => string | null;
	logout: () => void;
};

export type AuthStore = AuthState & AuthActions;

export function createAuthStore() {
	return create<AuthStore>((set, get) => ({
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
	}));
}
