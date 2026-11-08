import { z } from 'zod';

export const createCitaAdminSchema = z.object({
  pacienteId: z
    .string({ required_error: 'El ID del paciente (pacienteId) es obligatorio.' })
    .uuid('Formato de pacienteId inválido.'),
  medicoId: z
    .string({ required_error: 'El ID del médico (medicoId) es obligatorio.' })
    .uuid('Formato de medicoId inválido.'),
  fechaHora: z
    .string({ required_error: 'La fecha y hora de la cita (fechaHora) son obligatorias.' })
    .refine((val) => !Number.isNaN(Date.parse(val)), 'Formato de fechaHora inválido (use ISO 8601).'),
  duracionMinutos: z
    .number()
    .int()
    .min(15, 'La duración mínima es de 15 minutos.')
    .max(120, 'La duración máxima es de 120 minutos.')
    .default(30),
  motivo: z
    .string({ required_error: 'El motivo de consulta es obligatorio.' })
    .trim()
    .min(5, 'Describa el motivo de consulta (mínimo 5 caracteres).')
    .max(300, 'El motivo no debe exceder 300 caracteres.'),
  notas: z.string().trim().max(500).optional(),
});

export const updateEstadoCitaSchema = z.object({
  estado: z.enum(['PROGRAMADA', 'COMPLETADA', 'CANCELADA'], {
    required_error: 'El estado debe ser PROGRAMADA, COMPLETADA o CANCELADA.',
  }),
  notas: z.string().trim().max(500).optional(),
});

export type CreateCitaAdminDto = z.infer<typeof createCitaAdminSchema>;
export type UpdateEstadoCitaDto = z.infer<typeof updateEstadoCitaSchema>;
