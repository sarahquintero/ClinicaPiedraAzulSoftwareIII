export type UserRole = 'Administrador' | 'Paciente';

export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  pacienteId?: string | null;
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  token: string;
  user: SessionUser;
}

export interface ApiListResponse<T> {
  ok: boolean;
  total: number;
  data: T[];
}

export interface ApiItemResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface VerificarCedulaResponse {
  ok: boolean;
  cedula: string;
  existe: boolean;
  disponible: boolean;
}

export interface VerificarTarjetaResponse {
  ok?: boolean;
  tarjetaProfesional?: string;
  existe?: boolean;
  disponible: boolean;
}

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge';
  badgeMap?: Record<string, BadgeVariant>;
  hide?: 'tablet' | 'mobile';
}

export interface MedicoApiItem {
  id: string;
  cedula?: string;
  tarjetaProfesional: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  especialidadId: string;
  especialidad?: string | { id: string; nombre: string };
  especialidadNombre?: string;
  consultorio: string;
  diasAtencion: string;
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
}

export interface CreateMedicoPayload {
  cedula: string;
  tarjetaProfesional: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad: string;
  consultorio: string;
  diasAtencion: string;
  horaInicio: string;
  horaFin: string;
}

export interface PacienteApiItem {
  id: string;
  tipoDocumento: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  nombreCompleto?: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion?: string | null;
  grupoSanguineo?: string | null;
  alergias?: string | null;
}

export interface CreatePacientePayload {
  tipoDocumento: 'CC' | 'TI' | 'CE' | 'PASAPORTE';
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: 'M' | 'F' | 'OTRO';
  telefono: string;
  email: string;
  direccion?: string;
  grupoSanguineo?: string;
  alergias?: string;
  password?: string;
}

export interface CitaApiItem {
  id: string;
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  duracionMinutos: number;
  motivo: string;
  notas?: string | null;
  estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';
  medico: {
    id: string;
    nombres: string;
    apellidos: string;
    consultorio: string;
    especialidad: {
      id: string;
      nombre: string;
    };
  };
  paciente: {
    id: string;
    tipoDocumento: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
  };
}

export interface CreateCitaPayload {
  pacienteId: string;
  medicoId: string;
  fechaHora: string;
  duracionMinutos: number;
  motivo: string;
  notas?: string;
}
