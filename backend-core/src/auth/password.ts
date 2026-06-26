export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export function createBcryptPasswordHasher(saltRounds = 10): IPasswordHasher {
  return {
    async hash(password: string): Promise<string> {
      const bcrypt = await import("bcrypt");
      return bcrypt.hash(password, saltRounds);
    },
    async compare(password: string, hash: string): Promise<boolean> {
      const bcrypt = await import("bcrypt");
      return bcrypt.compare(password, hash);
    },
  };
}
