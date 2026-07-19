import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { UserStore } from "../../user";
import { tryCatch } from "../../utils";
import type { IAuthService } from "../service";
import type { AuthStore } from "../store";

export function createUseAuthRefresh<
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
	return () => {
		const authService = useAuthService();
		const setAccessToken = useAuthStore((s) => s.setAccessToken);
		const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
		const hasRefreshed = useAuthStore((s) => s.hasRefreshed);
		const setUser = useUserStore((s) => s.setUser);

		useEffect(() => {
			if (isLoggedIn || hasRefreshed) return;

			const refresh = async () => {
				const [accessToken] = await tryCatch(authService.refresh());

				setAccessToken(accessToken);
				setUser(accessToken);
			};

			refresh();
		}, [authService, setAccessToken, isLoggedIn, hasRefreshed, setUser]);
	};
}
