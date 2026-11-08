import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createMedicoSchema = z
  .object({
    cedula: z
      .string({ required_error: 'La cédula del médico es obligatoria.' })
      .trim()
      .regex(/^[0-9A-Za-z-]{5,20}$/, 'La cédula debe tener entre 5 y 20 caracteres alfanuméricos.'),
    tarjetaProfesional: z
      .string({ required_error: 'La tarjeta profesional es obligatoria.' })
      .trim()
      .min(4, 'La tarjeta profesional debe tener al menos 4 caracteres.'),
    nombres: z
      .string({ required_error: 'Los nombres son obligatorios.' })
      .trim()
      .min(2, 'Los nombres deben tener al menos 2 caracteres.'),
    apellidos: z
      .string({ required_error: 'Los apellidos son obligatorios.' })
      .trim()
      .min(2, 'Los apellidos deben tener al menos 2 caracteres.'),
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio.' })
      .trim()
      .email('Formato de correo electrónico inválido.'),
    telefono: z
      .string({ required_error: 'El teléfono es obligatorio.' })
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 dígitos.'),
    especialidadId: z.string().uuid('ID de especialidad inválido.').optional(),
    especialidad: z.string().trim().min(3, 'El nombre de la especialidad es demasiado corto.').optional(),
    consultorio: z
      .string({ required_error: 'El consultorio es obligatorio.' })
      .trim()
      .min(2, 'Especifique el consultorio asignado.'),
    diasAtencion: z.string().trim().default('LUN,MAR,MIE,JUE,VIE'),
    horaInicio: z
      .string()
      .regex(timeRegex, 'Formato de horaInicio inválido (use HH:MM).')
      .default('08:00'),
    horaFin: z
      .string()
      .regex(timeRegex, 'Formato de horaFin inválido (use HH:MM).')
      .default('17:00'),
    biografia: z.string().trim().optional(),
    activo: z.boolean().default(true),
  })
  .refine((data) => Boolean(data.especialidadId || data.especialidad), {
    message: 'Debe especificar especialidadId o el nombre de la especialidad.',
    path: ['especialidad'],
  })
  .refine((data) => data.horaInicio < data.horaFin, {
    message: 'La horaInicio debe ser anterior a la horaFin.',
    path: ['horaFin'],
  });

export const toggleEstadoMedicoSchema = z.object({
  activo: z.boolean({ required_error: 'El campo activo (boolean) es obligatorio.' }),
});

export type CreateMedicoDto = z.infer<typeof createMedicoSchema>;
