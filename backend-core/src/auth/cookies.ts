import type { CookieOptions, Response } from "express";

export type AuthCookieConfig = {
  name?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "none" | "strict";
  domain?: string;
  path?: string;
  maxAge?: number;
};

export function createAuthCookieHelpers(config: AuthCookieConfig = {}) {
  const cookieName = config.name ?? "auth";

  const options: CookieOptions = {
    httpOnly: config.httpOnly ?? true,
    secure: config.secure ?? false,
    sameSite: config.sameSite ?? "lax",
    path: config.path ?? "/",
    domain: config.domain,
    maxAge: config.maxAge ?? 3 * 24 * 60 * 60 * 1000,
    signed: false,
  };

  function setRefreshToken(token: string, res: Response, name = cookieName) {
    res.cookie(name, token, options);
  }

  function clearRefreshToken(res: Response, name = cookieName) {
    const { maxAge: _m, sameSite: _s, ...clearOptions } = options;
    res.clearCookie(name, clearOptions);
  }

  return { setRefreshToken, clearRefreshToken, options };
}
