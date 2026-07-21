import axios from "axios";
import type { AuthApiResponse, AuthTokens } from "../api/types";
import { ForbiddenError } from "../errors";
import type {
	IAuthService,
	TPasswordResetResponse,
	TResetPassword,
} from "./auth.types";

export type AuthServiceOptions = {
	baseUrl: string;
	endpoints: {
		login: {
			method: "post";
			url: string;
		};
		register: {
			method: "put" | "post";
			url: string;
		};
		logout: {
			method: "post" | "get";
			url: string;
		};
		refresh: {
			method: "get" | "post";
			url: string;
		};
		requestPasswordReset?: {
			method: "post";
			url: string;
			resetPageDetails: {
				url: string;
				queryName: string;
			};
		};
		resetPassword?: {
			method: "post";
			url: string;
		};
	};
	getAccessToken?: () => string | null;
};

class AuthService<TLogin extends object, TRegister extends object>
	implements IAuthService<TLogin, TRegister>
{
	constructor(private options: AuthServiceOptions) {}

	private async request<T>(
		url: string,
		body?: object,
		method: "post" | "get" | "put" = "post",
	): Promise<T> {
		const token = this.options.getAccessToken?.() ?? null;

		const response = await axios.request<AuthApiResponse<T>>({
			baseURL: this.options.baseUrl,
			url,
			method,
			data: body,
			withCredentials: true,
			headers: {
				Authorization: token ? `Bearer ${token}` : undefined,
			},
		});

		return response.data as T;
	}

	async login(payload: TLogin) {
		const { method, url } = this.options.endpoints.login;
		const tokens = await this.request<AuthTokens>(url, payload, method);
		return tokens.accessToken;
	}

	async register(payload: TRegister) {
		const { method, url } = this.options.endpoints.register;
		const tokens = await this.request<AuthTokens>(url, payload, method);
		return tokens.accessToken;
	}

	async logout() {
		const { method, url } = this.options.endpoints.logout;
		await this.request(url, undefined, method);
	}

	async refresh() {
		const { method, url } = this.options.endpoints.refresh;
		const tokens = await this.request<AuthTokens>(url, undefined, method);
		return tokens.accessToken;
	}

	async requestPasswordReset(email: string): Promise<TPasswordResetResponse> {
		if (!this.options.endpoints.requestPasswordReset)
			throw new ForbiddenError("Request password reset endpoint not defined");

		const {
			method,
			url,
			resetPageDetails: { url: resetUrl, queryName },
		} = this.options.endpoints.requestPasswordReset;
		const res = await this.request<TPasswordResetResponse>(
			url,
			{ email, url: resetUrl, queryName },
			method,
		);
		return res;
	}

	async resetPassword(
		payload: TResetPassword,
	): Promise<TPasswordResetResponse> {
		if (!this.options.endpoints.resetPassword)
			throw new ForbiddenError("Reset password endpoint not defined");

		const { method, url } = this.options.endpoints.resetPassword;
		const res = await this.request<TPasswordResetResponse>(
			url,
			payload,
			method,
		);
		return res;
	}
}

export function createAuthService<
	TLogin extends object,
	TRegister extends object,
>(options: AuthServiceOptions): IAuthService<TLogin, TRegister> {
	return new AuthService<TLogin, TRegister>(options);
}
