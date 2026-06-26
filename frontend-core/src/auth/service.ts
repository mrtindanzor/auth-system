import axios from "axios";
import type { AuthApiResponse, AuthTokens } from "../api/types";
import { ForbiddenError } from "../errors";

export interface IAuthService<
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object,
  TRequestPasswordReset extends object,
> {
  login(payload: TLogin): Promise<string>;
  register(payload: TRegister): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<string>;
  requestPasswordReset?(payload: TRequestPasswordReset): Promise<void>;
  resetPassword?(payload: TResetPassword): Promise<void>;
}

export type AuthServiceOptions = {
  baseUrl: string;
  endpoints: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    requestPasswordReset?: string;
    resetPassword?: string;
  };
  getAccessToken?: () => string | null;
};

class AuthService<
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object,
  TRequestPasswordReset extends object,
> {
  constructor(private options: AuthServiceOptions) {}

  private async request<T>(
    url: string,
    body?: object,
    method: "post" | "get" = "post",
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
    const tokens = await this.request<AuthTokens>(
      this.options.endpoints.login,
      payload,
    );
    return tokens.accessToken;
  }

  async register(payload: TRegister) {
    const tokens = await this.request<AuthTokens>(
      this.options.endpoints.register,
      payload,
    );
    return tokens.accessToken;
  }

  async logout() {
    await this.request(this.options.endpoints.logout, undefined, "get");
  }

  async refresh() {
    const tokens = await this.request<AuthTokens>(
      this.options.endpoints.refresh,
      undefined,
      "get",
    );
    return tokens.accessToken;
  }

  async requestPasswordReset(payload: TRequestPasswordReset) {
    if (!this.options.endpoints.requestPasswordReset)
      throw new ForbiddenError("Request password reset endpoint not defined");
    await this.request(this.options.endpoints.requestPasswordReset, payload);
  }

  async resetPassword(payload: TResetPassword) {
    if (!this.options.endpoints.resetPassword)
      throw new ForbiddenError("Reset password endpoint not defined");
    await this.request(this.options.endpoints.resetPassword, payload);
  }
}

export function createAuthService<
  TLogin extends object,
  TRegister extends object,
  TResetPassword extends object,
  TRequestPasswordReset extends object,
>(
  options: AuthServiceOptions,
): IAuthService<TLogin, TRegister, TResetPassword, TRequestPasswordReset> {
  return new AuthService<
    TLogin,
    TRegister,
    TResetPassword,
    TRequestPasswordReset
  >(options);
}
