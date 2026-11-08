import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .trim()
    .email('Debe ingresar un correo electrónico válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const registerPacienteSchema = z.object({
  tipoDocumento: z.enum(['CC', 'TI', 'CE', 'PASAPORTE']).default('CC'),
  cedula: z
    .string({ required_error: 'La cédula es obligatoria.' })
    .trim()
    .regex(/^[0-9A-Za-z-]{5,20}$/, 'La cédula debe tener entre 5 y 20 caracteres alfanuméricos.'),
  nombres: z
    .string({ required_error: 'Los nombres son obligatorios.' })
    .trim()
    .min(2, 'Los nombres deben tener al menos 2 caracteres.'),
  apellidos: z
    .string({ required_error: 'Los apellidos son obligatorios.' })
    .trim()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres.'),
  fechaNacimiento: z
    .string({ required_error: 'La fecha de nacimiento es obligatoria.' })
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha de nacimiento inválida.')
    .refine((val) => new Date(val) <= new Date(), 'La fecha de nacimiento no puede ser futura.'),
  genero: z.enum(['M', 'F', 'OTRO'], {
    required_error: 'El género es obligatorio (M, F u OTRO).',
  }),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio.' })
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos.')
    .max(20, 'El teléfono no debe superar 20 caracteres.'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .trim()
    .email('Formato de correo electrónico inválido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener mínimo 8 caracteres.'),
  direccion: z.string().trim().optional(),
  grupoSanguineo: z.string().trim().optional(),
  alergias: z.string().trim().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterPacienteDto = z.infer<typeof registerPacienteSchema>;
