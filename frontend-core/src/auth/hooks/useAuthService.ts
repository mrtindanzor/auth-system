import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { type AuthServiceOptions, createAuthService } from "../service";
import type { AuthStore } from "../store";

export function createUseAuthService<
	TLogin extends object,
	TRegister extends object,
	TResetPassword extends object,
	TRequestPasswordReset extends object,
>(
	useAuthStore: UseBoundStore<StoreApi<AuthStore>>,
	options: Omit<AuthServiceOptions, "getAccessToken">,
) {
	return () => {
		const getAccessToken = useAuthStore((s) => s.getAccessToken);
		return useMemo(
			() =>
				createAuthService<
					TLogin,
					TRegister,
					TResetPassword,
					TRequestPasswordReset
				>({
					...options,
					getAccessToken,
				}),
			[getAccessToken],
		);
	};
}
