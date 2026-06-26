export type AuthCookieConfig = {
  name?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "none" | "strict";
  domain?: string;
  path?: string;
  maxAge?: number;
};

export type CookieConfig = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

export function createAuthCookieHelpers(config: AuthCookieConfig = {}) {
  const cookieName = config.name ?? "auth";

  const options: Record<string, unknown> = {
    httpOnly: config.httpOnly ?? true,
    secure: config.secure ?? false,
    sameSite: config.sameSite ?? "lax",
    path: config.path ?? "/",
    domain: config.domain,
    maxAge: config.maxAge ?? 3 * 24 * 60 * 60 * 1000,
  };

  function setRefreshToken(token: string, name = cookieName): CookieConfig {
    return { name, value: token, options };
  }

  function clearRefreshToken(name = cookieName): CookieConfig {
    const { maxAge: _m, sameSite: _s, ...clearOptions } = options;
    return { name, options: clearOptions };
  }

  return { setRefreshToken, clearRefreshToken, options };
}
