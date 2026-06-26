import { UnauthorizedError } from "../errors/errors";

export type TokenPayload = Record<string, unknown> & {
  userId: string;
  role: "user" | "admin";
};

export type AttachUserResult = {
  tokenPayload: TokenPayload;
  userId: string;
  role: "user" | "admin";
};

export interface ITokenVerifier {
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(
    token: string,
  ): Promise<{ userId: string; role: "user" | "admin" } | null>;
}

export class AuthMiddleware {
  constructor(private verifier: ITokenVerifier) {}

  async attachUser(accessToken: string): Promise<AttachUserResult | null> {
    if (!accessToken) return null;

    const payload = await this.verifier.verifyAccessToken(accessToken);
    if (!payload) return null;

    return {
      tokenPayload: payload,
      userId: payload.userId,
      role: payload.role,
    };
  }

  requireAuth(user: { role?: string } | null): void {
    if (!user?.role) throw new UnauthorizedError();
  }

  requireRole(user: { role?: string } | null, ...roles: string[]): void {
    if (!user?.role || !roles.includes(user.role)) {
      throw new UnauthorizedError();
    }
  }
}

export function createAuthMiddleware(verifier: ITokenVerifier) {
  return new AuthMiddleware(verifier);
}
