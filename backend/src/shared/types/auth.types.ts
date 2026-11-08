export const ROLES_USUARIO = ['Administrador', 'Paciente'] as const;
export type RolUsuario = (typeof ROLES_USUARIO)[number];

export interface JwtUserPayload {
  sub: string;
  id: string;
  email: string;
  nombre: string;
  role: RolUsuario;
  pacienteId: string | null;
  iat?: number;
  exp?: number;
}
