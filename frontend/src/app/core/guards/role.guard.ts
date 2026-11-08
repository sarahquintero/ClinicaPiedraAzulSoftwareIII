import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/clinic.models';
import { AuthService } from '../services/auth.service';

/**
 * Guard 2 (Autorización RBAC):
 * Verifica que el rol embebido en el JWT coincida con los roles autorizados en la ruta.
 * Si no hay sesión, redirige a /login; si el rol no coincide, redirige a /unauthorized.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  const userRole = authService.currentRole();

  if (allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole))) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
