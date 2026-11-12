import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/app-error';
import { CreateMedicoDto } from './medicos.schemas';

export class MedicosService {
  async verificarTarjeta(tarjeta: string) {
    const tarjetaNormalized = tarjeta.trim();
    if (!tarjetaNormalized) {
      throw AppError.badRequest(
        'Debe proporcionar un número de tarjeta profesional para verificar.'
      );
    }

    const medico = await prisma.medico.findUnique({
      where: { tarjetaProfesional: tarjetaNormalized },
      select: { id: true },
    });

    const existe = Boolean(medico);
    return {
      tarjetaProfesional: tarjetaNormalized,
      existe,
      disponible: !existe,
    };
  }

  async listPublic(filters?: { especialidadId?: string; especialidad?: string }) {
    const medicos = await prisma.medico.findMany({
      where: {
        activo: true,
        ...(filters?.especialidadId ? { especialidadId: filters.especialidadId } : {}),
        ...(filters?.especialidad
          ? {
              especialidad: {
                nombre: { contains: filters.especialidad },
              },
            }
          : {}),
      },
      include: {
        especialidad: {
          select: { id: true, nombre: true, descripcion: true, icono: true },
        },
      },
      orderBy: [{ especialidad: { nombre: 'asc' } }, { apellidos: 'asc' }],
    });

    return medicos.map((m) => ({
      id: m.id,
      nombres: m.nombres,
      apellidos: m.apellidos,
      nombreCompleto: `Dr(a). ${m.nombres} ${m.apellidos}`,
      tarjetaProfesional: m.tarjetaProfesional,
      especialidadId: m.especialidadId,
      especialidad: m.especialidad.nombre,
      especialidadDetalle: m.especialidad,
      consultorio: m.consultorio,
      diasAtencion: m.diasAtencion,
      horaInicio: m.horaInicio,
      horaFin: m.horaFin,
      biografia: m.biografia,
    }));
  }

  async listAdmin() {
    const medicos = await prisma.medico.findMany({
      include: {
        especialidad: true,
        _count: {
          select: { citas: true },
        },
      },
      orderBy: [{ activo: 'desc' }, { apellidos: 'asc' }],
    });

    return medicos.map((m) => ({
      ...m,
      nombreCompleto: `Dr(a). ${m.nombres} ${m.apellidos}`,
      especialidadNombre: m.especialidad.nombre,
      totalCitas: m._count.citas,
    }));
  }

  async create(dto: CreateMedicoDto) {
    const emailNormalized = dto.email.toLowerCase().trim();
    const cedulaNormalized = dto.cedula.trim();
    const tpNormalized = dto.tarjetaProfesional.trim();

    const [porCedula, porTp, porEmail] = await Promise.all([
      prisma.medico.findUnique({ where: { cedula: cedulaNormalized } }),
      prisma.medico.findUnique({ where: { tarjetaProfesional: tpNormalized } }),
      prisma.medico.findUnique({ where: { email: emailNormalized } }),
    ]);

    if (porCedula) {
      throw AppError.conflict('Ya existe un médico registrado con esta cédula.');
    }
    if (porTp) {
      throw AppError.conflict('Ya existe un médico con esta tarjeta profesional.');
    }
    if (porEmail) {
      throw AppError.conflict('Ya existe un médico con este correo electrónico.');
    }

    let especialidadId = dto.especialidadId;
    if (especialidadId) {
      const esp = await prisma.especialidad.findUnique({ where: { id: especialidadId } });
      if (!esp) {
        throw AppError.notFound('La especialidad indicada no existe.');
      }
    } else if (dto.especialidad) {
      const nombreEsp = dto.especialidad.trim();
      const todas = await prisma.especialidad.findMany();
      const coincidencia = todas.find(
        (e) => e.nombre.toLowerCase() === nombreEsp.toLowerCase()
      );
      if (coincidencia) {
        especialidadId = coincidencia.id;
      } else {
        const nueva = await prisma.especialidad.create({
          data: {
            nombre: nombreEsp,
            descripcion: `Atención especializada en ${nombreEsp}`,
          },
        });
        especialidadId = nueva.id;
      }
    }

    const medico = await prisma.medico.create({
      data: {
        cedula: cedulaNormalized,
        tarjetaProfesional: tpNormalized,
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        email: emailNormalized,
        telefono: dto.telefono.trim(),
        especialidadId: especialidadId!,
        consultorio: dto.consultorio.trim(),
        diasAtencion: dto.diasAtencion,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        biografia: dto.biografia,
        activo: dto.activo,
      },
      include: {
        especialidad: true,
      },
    });

    return medico;
  }

  async toggleActivo(id: string, activo: boolean) {
    const existente = await prisma.medico.findUnique({ where: { id } });
    if (!existente) {
      throw AppError.notFound('Médico no encontrado.');
    }

    return prisma.medico.update({
      where: { id },
      data: { activo },
      include: { especialidad: true },
    });
  }
}

export const medicosService = new MedicosService();
