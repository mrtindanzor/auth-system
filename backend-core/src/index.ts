export { UnauthorizedError } from "./errors";
export { encodeAuthSecret, deriveAuthSecret } from "./config";
export type { AuthSecretConfig, AuthTokenExpiry } from "./config";
export {
  signToken,
  decodeToken,
  verifyToken,
  generateTokenPair,
  createAuthCookieHelpers,
  createBcryptPasswordHasher,
  createAuthMiddleware,
} from "./auth";
export type {
  TokenPair,
  AuthRole,
  AuthTokenPayload,
  TokenConfig,
  AuthCookieConfig,
  IPasswordHasher,
  ITokenVerifier,
  TokenPayload,
  IUserRepository,
  IAuthService,
} from "./auth";
export { getBearerToken } from "./utils";
