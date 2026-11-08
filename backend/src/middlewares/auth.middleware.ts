import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtUserPayload, ROLES_USUARIO, RolUsuario } from '../shared/types/auth.types';

/**
 * Middleware de autenticación JWT.
 * Devuelve 401 Unauthorized cuando no se envía token Bearer o cuando el token es inválido/expirado.
 */
export const verifyToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      ok: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Token de autenticación no proporcionado. Incluya el encabezado Authorization: Bearer <token>.',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({
      ok: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Token de autenticación vacío.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;

    if (!decoded?.sub || !decoded?.role || !ROLES_USUARIO.includes(decoded.role)) {
      res.status(401).json({
        ok: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Estructura del token JWT inválida.',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      ok: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Token de autenticación inválido o expirado.',
    });
  }
};

/**
 * Middleware de autorización basada en roles (RBAC).
 * Devuelve 403 Forbidden cuando el usuario autenticado no posee ninguno de los roles permitidos.
 */
export const checkRole = (allowedRoles: RolUsuario[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        ok: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Usuario no autenticado.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        ok: false,
        status: 403,
        error: 'Forbidden',
        message: `Acceso denegado: su rol (${req.user.role}) no tiene autorización. Rol requerido: ${allowedRoles.join(' o ')}.`,
      });
      return;
    }

    next();
  };
};
