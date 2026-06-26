export class AppError extends Error {
  status = 500;

  constructor(message = "Something went wrong", status = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  status = 401;
  name = "UnauthorizedError";

  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  status = 403;
  name = "ForbiddenError";

  constructor(message = "Forbidden") {
    super(message, 403);
  }
}
