export class AppError extends Error {
  status: number;
  name = "AppError";

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  name = "NotFoundError";

  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  name = "ForbiddenError";

  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class UnauthorizedError extends AppError {
  name = "UnauthorizedError";

  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ValidationError extends AppError {
  name = "ValidationError";

  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

export class RateLimitExceededError extends AppError {
  name = "RateLimitExceededError";

  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429);
  }
}
