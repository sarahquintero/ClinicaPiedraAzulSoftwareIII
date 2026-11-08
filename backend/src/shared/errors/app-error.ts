export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, errorCode = 'AppError', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, 'BadRequest', details);
  }

  static unauthorized(message = 'No autenticado: token faltante o inválido.'): AppError {
    return new AppError(401, message, 'Unauthorized');
  }

  static forbidden(message = 'Acceso denegado: no cuenta con el rol requerido.'): AppError {
    return new AppError(403, message, 'Forbidden');
  }

  static notFound(message: string): AppError {
    return new AppError(404, message, 'NotFound');
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, message, 'Conflict', details);
  }
}
