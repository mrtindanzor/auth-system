import { decodeJwt } from "jose";

export function decodeUserFromToken<T extends Record<string, unknown>>(
  token: string | null,
): T | null {
  if (!token) return null;

  try {
    const payload = decodeJwt<T>(token);
    const {
      iat: _ia,
      exp: _ex,
      iss: _is,
      aud: _au,
      sub: _su,
      jti: _jt,
      nbf: _nb,
      ...user
    } = payload;
    return user as T;
  } catch {
    return null;
  }
}
