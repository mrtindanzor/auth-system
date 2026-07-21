import { useCallback, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import type { StoreApi, UseBoundStore } from "zustand";
import type { IUserAccount } from "../../api/types";
import type { UserStore } from "../../user";
import { fe, tryCatch } from "../../utils";
import type { IAuthService, TResetPassword } from "../auth.types";
import type { AuthStore } from "../store";

export function createUseAuth<
	TUser extends IUserAccount,
	TLogin extends object,
	TRegister extends object,
>(
	useAuthStore: UseBoundStore<StoreApi<AuthStore<TUser>>>,
	useUserStore: UseBoundStore<StoreApi<UserStore<TUser>>>,
	useAuthService: () => IAuthService<TLogin, TRegister>,
) {
	function useSignin(props?: { resolver?: Resolver<TLogin> }) {
		const { register, handleSubmit, formState, reset, setError } =
			useForm<TLogin>(props);
		const authService = useAuthService();

		const onSubmit = handleSubmit(async (details) => {
			const [res, error] = await tryCatch(authService.login(details));
			if (error) {
				return setError("root", {
					message: fe(error),
				});
			}

			useAuthStore.getState().setAccessToken(res);
			useUserStore.getState().setUser(res);

			reset();
		});

		return { register, formState, onSubmit };
	}

	function useSignup(props?: { resolver?: Resolver<TRegister> }) {
		const { register, handleSubmit, formState, reset, setError } =
			useForm<TRegister>(props);
		const authService = useAuthService();

		const onSubmit = handleSubmit(async (details) => {
			const [res, error] = await tryCatch(authService.register(details));
			if (error) {
				return setError("root", {
					message: fe(error),
				});
			}

			useAuthStore.getState().setAccessToken(res);
			useUserStore.getState().setUser(res);

			reset();
		});

		return { register, formState, onSubmit };
	}

	function useRequestPasswordReset(props?: {
		resolver?: Resolver<{ email: string }>;
	}) {
		const { register, handleSubmit, formState, reset, setError } = useForm<{
			email: string;
		}>(props);
		const [successMessage, setSuccessMessage] = useState<string | null>(null);
		const authService = useAuthService();

		const onSubmit = handleSubmit(async ({ email }) => {
			setSuccessMessage(null);
			const [res, error] = await tryCatch(
				authService.requestPasswordReset(email),
			);

			if (error) {
				return setError("root", {
					message: fe(error),
				});
			}

			if (res) setSuccessMessage(res.message);
			reset();
		});

		return { register, formState, onSubmit, successMessage };
	}

	function usePasswordReset(props?: { resolver?: Resolver<TResetPassword> }) {
		const { register, handleSubmit, formState, reset, setError } =
			useForm<TResetPassword>(props);
		const [successMessage, setSuccessMessage] = useState<string | null>(null);
		const authService = useAuthService();

		const onSubmit = handleSubmit(async (details) => {
			setSuccessMessage(null);
			const [res, error] = await tryCatch(authService.resetPassword(details));

			if (error) {
				return setError("root", {
					message: fe(error),
				});
			}

			if (res) setSuccessMessage(res.message);
			reset();
		});

		return { register, formState, onSubmit, successMessage };
	}

	function useLogout() {
		const authService = useAuthService();
		const logout = useCallback(async () => {
			const [, error] = await tryCatch(authService.logout());
			if (!error) {
				useAuthStore.getState().setAccessToken(null);
				useUserStore.getState().setUser(null);
			}
		}, [authService]);
		return { logout };
	}

	return {
		useSignin,
		useSignup,
		useLogout,
		usePasswordReset,
		useRequestPasswordReset,
	};
}
