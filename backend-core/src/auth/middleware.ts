import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { getBearerToken } from "../utils/getBearerToken";

export type TokenPayload = Record<string, unknown> & {
  userId: string;
  role: "user" | "admin";
};

export interface ITokenVerifier {
  verifyAccessToken(token: string): Promise<TokenPayload | null>;
  verifyRefreshToken(token: string): Promise<{ userId: string; role: "user" | "admin" } | null>;
}

export function createAuthMiddleware(verifier: ITokenVerifier) {
  async function attachUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const accessToken = getBearerToken(req.headers.authorization ?? "");
    if (!accessToken) return next();

    const payload = await verifier.verifyAccessToken(accessToken);
    if (!payload) return next();

    res.locals.tokenPayload = payload;
    res.locals.userId = payload.userId;
    res.locals.role = payload.role;

    return next();
  }

  async function requireAuth(
    _req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!res.locals.role) throw new UnauthorizedError();
    return next();
  }

  async function requireRole(...roles: string[]) {
    return (_req: Request, res: Response, next: NextFunction) => {
      if (!res.locals.role || !roles.includes(res.locals.role as string)) {
        throw new UnauthorizedError();
      }
      return next();
    };
  }

  return { attachUser, requireAuth, requireRole };
}
