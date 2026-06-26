import { UnauthorizedError } from "../errors";
import { FindUserBy, IAuthService, IUserRepository } from "./contracts";
import { PasswordHasher } from "./password";
import { assertUniqueUser } from "./rules";
import { AuthRole, generateTokenPair, TokenConfig, TokenPair } from "./tokens";

class AuthService implements IAuthService {
  private passwordHasher = new PasswordHasher();

  constructor(
    private repo: IUserRepository,
    private authConfig: {
      accessConfig: TokenConfig;
      refreshConfig: TokenConfig;
    },
  ) {}

  async login(
    details: { credentials: string; password: string },
    findBy: FindUserBy,
    getRole?: <T>(user?: T) => AuthRole,
  ) {
    const service = this.repo?.[findBy];
    if (!service) throw Error("Service not found");

    const user = await service(details.credentials);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const passwordMatch = await this.passwordHasher.compare(
      details.password,
      user.password,
    );
    if (!passwordMatch) throw new UnauthorizedError("Invalid credentials");

    const tokens = await this.getAuthTokens(user, getRole?.(user) || "user");
    return tokens;
  }

  async register<T extends { password: string }>(
    details: T,
    findBy: FindUserBy,
    guardMultipleAccountsBy: keyof T & string,
  ): Promise<TokenPair> {
    let user = null;
    if (findBy === "findByEmailOrPhone") {
      const service = this.repo?.[findBy];

      user = await service?.({
        email: details[guardMultipleAccountsBy] as string,
        phone: details[guardMultipleAccountsBy] as string,
      });
    }

    if (findBy !== "findByEmailOrPhone") {
      const service = this.repo?.[findBy];
      user = await service?.(details[guardMultipleAccountsBy] as string);
    }

    assertUniqueUser(guardMultipleAccountsBy as never, details, user);

    const hashedPassword = await this.passwordHasher.hash(details.password);
    const userCreated = await this.repo.save({
      ...details,
      password: hashedPassword,
    });
    const tokens = await this.getAuthTokens(userCreated, "user");
    return tokens;
  }

  async refresh(userId: string, role?: AuthRole): Promise<TokenPair> {
    const user = await this.repo.findById(userId);
    if (!user) throw new UnauthorizedError("User not found");

    return this.getAuthTokens(user, role || "user");
  }

  private async getAuthTokens(
    entity: { id: string } | { id: string },
    role: AuthRole,
  ): Promise<TokenPair> {
    return await generateTokenPair(
      entity,
      role,
      this.authConfig.accessConfig,
      this.authConfig.refreshConfig,
    );
  }
}

export function createAuthService(
  repo: IUserRepository,
  authConfig: {
    accessConfig: TokenConfig;
    refreshConfig: TokenConfig;
  },
) {
  return new AuthService(repo, authConfig);
}
