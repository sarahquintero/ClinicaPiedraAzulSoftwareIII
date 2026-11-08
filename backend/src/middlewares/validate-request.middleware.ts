import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));
      res.status(400).json({
        ok: false,
        status: 400,
        error: 'ValidationError',
        message: 'Datos de entrada inválidos. Revise los campos enviados.',
        details,
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
};
