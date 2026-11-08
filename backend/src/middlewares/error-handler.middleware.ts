import { Prisma } from '@prisma/client';
import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/app-error';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    status: 404,
    error: 'NotFound',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      status: err.statusCode,
      error: err.errorCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      status: 400,
      error: 'ValidationError',
      message: 'Error de validación en los datos recibidos.',
      details: err.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(', ')
        : 'campo único';
      res.status(409).json({
        ok: false,
        status: 409,
        error: 'Conflict',
        message: `Ya existe un registro con el mismo valor en: ${target}.`,
      });
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      ok: false,
      status: 400,
      error: 'BadRequest',
      message: 'El cuerpo JSON enviado tiene un formato inválido.',
    });
    return;
  }

  console.error('[UnhandledError]', err);
  res.status(500).json({
    ok: false,
    status: 500,
    error: 'InternalServerError',
    message: 'Error interno del servidor.',
  });
};
