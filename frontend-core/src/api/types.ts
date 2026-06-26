export type AuthEndpoints = {
  login: string;
  register: string;
  logout: string;
  refresh: string;
  requestPasswordReset?: string;
  resetPassword?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type AuthApiResponse<T = AuthTokens> = {
  message: string;
  status: number;
} & T;
