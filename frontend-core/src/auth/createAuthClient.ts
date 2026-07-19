import { createUserStore } from "../user";
import { createUseAuth } from "./hooks/useAuth";
import { createUseAuthRefresh } from "./hooks/useAuthRefresh";
import { createUseAuthService } from "./hooks/useAuthService";
import { type AuthGuardConfig, createAuthGuard } from "./middleware";
import type { AuthServiceOptions } from "./service";
import { createAuthStore } from "./store";

export function createAuthClient<
	TUser extends object,
	TLogin extends object,
	TRegister extends object,
	TResetPassword extends object = object,
	TRequestPasswordReset extends object = object,
>(
	options: Omit<AuthServiceOptions, "getAccessToken">,
	authGuardConfig: Omit<AuthGuardConfig, "isAuthenticated">,
) {
	const useAuthStore = createAuthStore();
	const authGuard = createAuthGuard({
		...authGuardConfig,
		isAuthenticated: () => useAuthStore.getState().isLoggedIn,
	});
	const useUserStore = createUserStore<TUser>();
	const useAuthService = createUseAuthService<
		TLogin,
		TRegister,
		TResetPassword,
		TRequestPasswordReset
	>(useAuthStore, options);
	const { useLogout, useSignin, useSignup } = createUseAuth(
		useAuthStore,
		useUserStore,
		useAuthService,
	);
	const useAuthRefresh = createUseAuthRefresh(
		useAuthStore,
		useUserStore,
		useAuthService,
	);

	return {
		useAuthStore,
		useAuthService,
		useUserStore,
		useLogout,
		useSignin,
		useSignup,
		authGuard,
		useAuthRefresh,
	};
}
