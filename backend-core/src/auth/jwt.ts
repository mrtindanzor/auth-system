import { decodeJwt, jwtVerify, SignJWT } from "jose";

export async function signToken<T extends Record<string, unknown>>(
  payload: T,
  secret: Uint8Array,
  expiresIn: string,
): Promise<string> {
  return await new SignJWT(payload)
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
}

export function decodeToken<T>(token: string): T | null {
  try {
    return decodeJwt<T>(token);
  } catch {
    return null;
  }
}

export async function verifyToken<T extends Record<string, unknown>>(
  token: string,
  secret: Uint8Array,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify<T>(token, secret);
    const {
      aud: _a,
      exp: _ex,
      iat: _ia,
      iss: _is,
      jti: _jt,
      sub: _su,
      nbf: _nb,
      ...rest
    } = payload;
    return rest as T;
  } catch {
    return null;
  }
}
