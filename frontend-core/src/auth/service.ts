import type { AuthTokens, AuthApiResponse } from "../api/types";

export interface IAuthService {
  login(payload: { credentials: string; password: string }): Promise<string>;
  register(payload: Record<string, unknown>): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<string>;
  requestPasswordReset?(email: string): Promise<void>;
  resetPassword?(payload: { password: string; access: string }): Promise<void>;
}

export type AuthServiceOptions = {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
  };
  getAccessToken?: () => string | null;
};

export function createAuthService(options: AuthServiceOptions): IAuthService {
  const { baseUrl, endpoints } = options;

  async function request<T>(
    url: string,
    body?: Record<string, unknown>,
    method: "post" | "get" = "post",
  ): Promise<T> {
    const axios = (await import("axios")).default;
    const token = options.getAccessToken?.() ?? null;

    const response = await axios.request<AuthApiResponse<T>>({
      baseURL: baseUrl,
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

  return {
    async login(payload) {
      const tokens = await request<AuthTokens>(endpoints.login, payload);
      return tokens.accessToken;
    },

    async register(payload) {
      const tokens = await request<AuthTokens>(endpoints.register, payload);
      return tokens.accessToken;
    },

    async logout() {
      await request(endpoints.logout, undefined, "get");
    },

    async refresh() {
      const tokens = await request<AuthTokens>(endpoints.refresh, undefined, "get");
      return tokens.accessToken;
    },

    async requestPasswordReset(email) {
      await request(endpoints.requestPasswordReset ?? "/auth/request-password-reset", { email });
    },

    async resetPassword(payload) {
      await request(endpoints.resetPassword ?? "/auth/reset-password", payload);
    },
  };
}
