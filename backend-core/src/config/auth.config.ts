export type AuthSecretConfig = {
  accessTokenSecret: string;
  refreshTokenSecret: string;
};

export type AuthTokenExpiry = {
  accessTokenExpiresIn?: string;
  refreshTokenExpiresIn?: string;
};

export function encodeAuthSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function deriveAuthSecret(secret: string, salt: string): Uint8Array {
  return new TextEncoder().encode(`${salt}${secret}`);
}
