import { UserRole } from '../core/models/clinic.models';

export const TOKEN_STORAGE_KEY = 'pa_jwt_token';

function toBase64Url(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Construye un JWT de prueba (sin firma real) con la misma estructura
 * que emite el backend. El frontend solo decodifica el payload.
 */
export function buildFakeJwt(role: UserRole, expiresInSeconds = 3600): string {
  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const payload = toBase64Url({
    sub: 'user-test-id',
    id: 'user-test-id',
    nombre: role === 'Administrador' ? 'Admin Prueba' : 'Paciente Prueba',
    email: role === 'Administrador' ? 'admin@piedraazul.com' : 'paciente@piedraazul.com',
    role,
    pacienteId: role === 'Paciente' ? 'paciente-test-id' : null,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${header}.${payload}.firma-de-prueba`;
}

export function loginAs(role: UserRole): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, buildFakeJwt(role));
}

export function logout(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}