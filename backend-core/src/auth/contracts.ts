import type { AuthRole, TokenPair } from "./tokens";

export interface IUserRepository<
  T extends { id: string; password: string } = { id: string; password: string },
> {
  save: (entity: Omit<T, "id">) => Promise<T>;
  updateById: (id: string, entity: Partial<T>) => Promise<T>;
  updateOne: (entity: Partial<T>) => Promise<T>;
  findById(id: string): Promise<T | null>;
  findByEmail?(email: string): Promise<T | null>;
  findByPhone?: (phone: string) => Promise<T | null>;
  findByEmailOrPhone?(props: {
    email?: string;
    phone?: string;
  }): Promise<T | null>;
}

export type FindUserBy = keyof Pick<
  IUserRepository,
  "findByEmail" | "findByEmailOrPhone" | "findById" | "findByPhone"
>;

export interface IAuthService {
  login(
    details: { credentials: string; password: string },
    findBy: FindUserBy,
    getRole?: <T>(user?: T) => AuthRole,
  ): Promise<TokenPair>;
  register: <T extends { password: string }>(
    details: T,
    findBy: FindUserBy,
    guardMultipleAccountsBy: keyof T & string,
  ) => Promise<TokenPair>;
  refresh(refreshToken: string): Promise<TokenPair>;
}
