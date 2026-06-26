import type { AuthRole, TokenPair } from "./tokens";

export interface IUserRepository<T extends { id: string } = { id: string }> {
  findById(id: string): Promise<T | null>;
  findByEmail?(email: string): Promise<T | null>;
  findByEmailOrPhone?(props: {
    email?: string;
    phone?: string;
  }): Promise<T | null>;
}

export interface IAuthService<
  TUser extends { id: string } = { id: string },
  TAdmin extends { id: string } = { id: string },
> {
  login(details: { credentials: string; password: string }): Promise<TokenPair>;
  register(details: Record<string, unknown>): Promise<TokenPair>;
  refresh(refreshToken: string): Promise<TokenPair>;
  logout(refreshToken: string): Promise<void>;
  getAuthTokens(entity: TUser | TAdmin, role: AuthRole): Promise<TokenPair>;
}
