import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { IUserAccount } from "../../api/types";
import { type AuthServiceOptions, createAuthService } from "../service";
import type { AuthStore } from "../store";

export function createUseAuthService<
	TUser extends IUserAccount,
	TLogin extends object,
	TRegister extends object,
	TResetPassword extends object,
	TRequestPasswordReset extends object,
>(
	useAuthStore: UseBoundStore<StoreApi<AuthStore<TUser>>>,
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
