import { useCallback } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { UserStore } from "../../user";
import type { IAuthService } from "../service";
import type { AuthStore } from "../store";

export function createUseAuth<
	TUser extends object,
	TLogin extends object,
	TRegister extends object,
	TResetPassword extends object,
	TRequestPasswordReset extends object,
>(
	useAuthStore: UseBoundStore<StoreApi<AuthStore>>,
	useUserStore: UseBoundStore<StoreApi<UserStore<TUser>>>,
	useAuthService: () => IAuthService<
		TLogin,
		TRegister,
		TResetPassword,
		TRequestPasswordReset
	>,
) {
	return function useAuth() {
		const setAccessToken = useAuthStore((s) => s.setAccessToken);
		const setUser = useUserStore((s) => s.setUser);
		const authService = useAuthService();

		const login = useCallback(
			async (payload: TLogin) => {
				const accessToken = await authService.login(payload);
				setAccessToken(accessToken);
				setUser(accessToken);
			},
			[authService, setAccessToken, setUser],
		);

		const register = useCallback(
			async (payload: TRegister) => {
				const accessToken = await authService.register(payload);
				setAccessToken(accessToken);
				setUser(accessToken);
			},
			[authService, setAccessToken, setUser],
		);

		const logout = useCallback(async () => {
			await authService.logout();
			setAccessToken(null);
			setUser(null);
		}, [authService, setAccessToken, setUser]);

		return { login, register, logout };
	};
}
