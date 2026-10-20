export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(400, message, field ? { field } : undefined);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized.") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", field?: string) {
    super(403, message, field ? { field } : undefined);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super(409, message, field ? { field } : undefined);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable. Please try again shortly.") {
    super(503, message);
  }
}
