export class AppError extends Error {
	status = 500;

	constructor(message = "Internal Server Error", status = 500) {
		super(message);
		this.status = status;
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}
