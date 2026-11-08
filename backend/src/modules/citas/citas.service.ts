import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/app-error';
import {
  CreateCitaAdminDto,
  UpdateEstadoCitaDto,
} from './citas.schemas';

const citaInclude = {
  medico: {
    include: {
      especialidad: {
        select: { id: true, nombre: true },
      },
    },
  },
  paciente: {
    select: {
      id: true,
      tipoDocumento: true,
      cedula: true,
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
    },
  },
} as const;

export class CitasService {
  private async validarDisponibilidad(
    medicoId: string,
    pacienteId: string,
    inicio: Date,
    duracionMinutos: number
  ) {
    const fin = new Date(inicio.getTime() + duracionMinutos * 60_000);
    const margenDiaInicio = new Date(inicio.getTime() - 24 * 60 * 60_000);
    const margenDiaFin = new Date(fin.getTime() + 24 * 60 * 60_000);

    const citasCercanas = await prisma.cita.findMany({
      where: {
        estado: 'PROGRAMADA',
        fechaHora: {
          gte: margenDiaInicio,
          lte: margenDiaFin,
        },
        OR: [{ medicoId }, { pacienteId }],
      },
    });

    for (const cita of citasCercanas) {
      const cInicio = cita.fechaHora;
      const cFin = new Date(cInicio.getTime() + cita.duracionMinutos * 60_000);
      const haySolapamiento = inicio < cFin && fin > cInicio;

      if (haySolapamiento) {
        if (cita.medicoId === medicoId) {
          throw AppError.conflict(
            'El médico seleccionado ya tiene una cita programada en ese horario.'
          );
        }
        if (cita.pacienteId === pacienteId) {
          throw AppError.conflict(
            'El paciente ya tiene otra cita programada que se cruza con ese horario.'
          );
        }
      }
    }
  }

  async listMisCitas(usuarioId: string) {
    const paciente = await prisma.paciente.findUnique({
      where: { usuarioId },
    });

    if (!paciente) {
      throw AppError.notFound('No se encontró un perfil de paciente asociado a su usuario.');
    }

    return prisma.cita.findMany({
      where: { pacienteId: paciente.id },
      include: citaInclude,
      orderBy: { fechaHora: 'asc' },
    });
  }

  async listAll(filters?: { estado?: string; medicoId?: string; pacienteId?: string }) {
    return prisma.cita.findMany({
      where: {
        ...(filters?.estado ? { estado: filters.estado } : {}),
        ...(filters?.medicoId ? { medicoId: filters.medicoId } : {}),
        ...(filters?.pacienteId ? { pacienteId: filters.pacienteId } : {}),
      },
      include: citaInclude,
      orderBy: { fechaHora: 'asc' },
    });
  }

  async create(dto: CreateCitaAdminDto, creadoPorId: string) {
    const fechaCita = new Date(dto.fechaHora);
    if (fechaCita <= new Date()) {
      throw AppError.badRequest('La fecha y hora de la cita deben ser futuras.');
    }

    const [paciente, medico] = await Promise.all([
      prisma.paciente.findUnique({ where: { id: dto.pacienteId } }),
      prisma.medico.findUnique({ where: { id: dto.medicoId } }),
    ]);

    if (!paciente) {
      throw AppError.notFound('El paciente indicado no existe.');
    }
    if (!medico) {
      throw AppError.notFound('El médico indicado no existe.');
    }
    if (!medico.activo) {
      throw AppError.badRequest('El médico seleccionado no se encuentra activo para agendar citas.');
    }

    await this.validarDisponibilidad(
      dto.medicoId,
      dto.pacienteId,
      fechaCita,
      dto.duracionMinutos
    );

    return prisma.cita.create({
      data: {
        pacienteId: dto.pacienteId,
        medicoId: dto.medicoId,
        fechaHora: fechaCita,
        duracionMinutos: dto.duracionMinutos,
        motivo: dto.motivo.trim(),
        notas: dto.notas,
        estado: 'PROGRAMADA',
        creadoPorId,
      },
      include: citaInclude,
    });
  }

  async updateEstado(citaId: string, dto: UpdateEstadoCitaDto) {
    const existente = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!existente) {
      throw AppError.notFound('Cita médica no encontrada.');
    }

    return prisma.cita.update({
      where: { id: citaId },
      data: {
        estado: dto.estado,
        ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      },
      include: citaInclude,
    });
  }
}

export const citasService = new CitasService();
