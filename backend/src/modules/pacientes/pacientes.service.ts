import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/app-error';
import { CreatePacienteAdminDto } from './pacientes.schemas';

export class PacientesService {
  async verificarCedula(cedula: string) {
    const cedulaNormalized = cedula.trim();
    if (!cedulaNormalized) {
      throw AppError.badRequest('Debe proporcionar un número de cédula para verificar.');
    }

    const paciente = await prisma.paciente.findUnique({
      where: { cedula: cedulaNormalized },
      select: { id: true },
    });

    const existe = Boolean(paciente);
    return {
      cedula: cedulaNormalized,
      existe,
      disponible: !existe,
    };
  }

  async listAll() {
    const pacientes = await prisma.paciente.findMany({
      include: {
        _count: {
          select: { citas: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pacientes.map((p) => ({
      ...p,
      nombreCompleto: `${p.nombres} ${p.apellidos}`,
      tieneCuenta: Boolean(p.usuarioId),
      totalCitas: p._count.citas,
    }));
  }

  async create(dto: CreatePacienteAdminDto) {
    const emailNormalized = dto.email.toLowerCase().trim();
    const cedulaNormalized = dto.cedula.trim();

    const [existenteCedula, existenteEmailPaciente, existenteEmailUsuario] = await Promise.all([
      prisma.paciente.findUnique({ where: { cedula: cedulaNormalized } }),
      prisma.paciente.findUnique({ where: { email: emailNormalized } }),
      dto.password
        ? prisma.usuario.findUnique({ where: { email: emailNormalized } })
        : Promise.resolve(null),
    ]);

    if (existenteCedula) {
      throw AppError.conflict('Ya existe un paciente registrado con esta cédula.');
    }
    if (existenteEmailPaciente || existenteEmailUsuario) {
      throw AppError.conflict('El correo electrónico ya está asociado a otro registro.');
    }

    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const nombreCompleto = `${dto.nombres.trim()} ${dto.apellidos.trim()}`;

      return prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nombre: nombreCompleto,
            email: emailNormalized,
            passwordHash,
            rol: 'Paciente',
          },
        });

        return tx.paciente.create({
          data: {
            usuarioId: usuario.id,
            tipoDocumento: dto.tipoDocumento,
            cedula: cedulaNormalized,
            nombres: dto.nombres.trim(),
            apellidos: dto.apellidos.trim(),
            fechaNacimiento: new Date(dto.fechaNacimiento),
            genero: dto.genero,
            telefono: dto.telefono.trim(),
            email: emailNormalized,
            direccion: dto.direccion,
            grupoSanguineo: dto.grupoSanguineo,
            alergias: dto.alergias,
          },
        });
      });
    }

    return prisma.paciente.create({
      data: {
        tipoDocumento: dto.tipoDocumento,
        cedula: cedulaNormalized,
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        fechaNacimiento: new Date(dto.fechaNacimiento),
        genero: dto.genero,
        telefono: dto.telefono.trim(),
        email: emailNormalized,
        direccion: dto.direccion,
        grupoSanguineo: dto.grupoSanguineo,
        alergias: dto.alergias,
      },
    });
  }
}

export const pacientesService = new PacientesService();
