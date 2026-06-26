import { signToken } from "./jwt";

export type AuthRole = "user" | "admin";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type TokenConfig = {
  secret: Uint8Array;
  expiresIn: string;
};

export type AuthTokenPayload = {
  userId: string;
  role: AuthRole;
};

export async function generateTokenPair<T extends { id: string }>(
  entity: T,
  role: AuthRole,
  accessConfig: TokenConfig,
  refreshConfig: TokenConfig,
): Promise<TokenPair> {
  const { id, password: _p, ...rest } = entity as T & { password?: string };

  const [accessToken, refreshToken] = await Promise.all([
    signToken(
      { userId: id, id, ...rest, role },
      accessConfig.secret,
      accessConfig.expiresIn,
    ),
    signToken(
      { userId: id, role },
      refreshConfig.secret,
      refreshConfig.expiresIn,
    ),
  ]);

  return { accessToken, refreshToken };
}
