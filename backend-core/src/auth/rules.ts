import { ForbiddenError } from "../errors/errors";

export function assertUniqueUser<T>(
  by: keyof T,
  details: Partial<T>,
  user: T | undefined,
) {
  if (user) throw new ForbiddenError("User already exists");
  if (details[by]) throw new ForbiddenError("User already exists");
}
