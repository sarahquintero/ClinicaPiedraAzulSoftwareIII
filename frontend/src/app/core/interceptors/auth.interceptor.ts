import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional que adjunta automáticamente el encabezado
 * Authorization: Bearer <JWT> en las peticiones HTTP hacia rutas privadas.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isPublicAuthRoute = req.url.includes('/api/auth/login');
  const isPublicCedulaCheck = req.url.includes('/api/pacientes/verificar-cedula/');

  if (!token || isPublicAuthRoute || isPublicCedulaCheck) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authorizedRequest);
};
