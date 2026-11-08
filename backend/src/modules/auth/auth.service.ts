import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/app-error';
import { JwtUserPayload, ROLES_USUARIO, RolUsuario } from '../../shared/types/auth.types';
import { LoginDto, RegisterPacienteDto } from './auth.schemas';

export class AuthService {
  private signToken(payload: Omit<JwtUserPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  async login(dto: LoginDto) {
    const emailNormalized = dto.email.toLowerCase().trim();

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalized },
      include: { paciente: true },
    });

    if (!usuario || !usuario.activo) {
      throw AppError.unauthorized('Credenciales inválidas o cuenta inactiva.');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValido) {
      throw AppError.unauthorized('Credenciales inválidas o cuenta inactiva.');
    }

    const role: RolUsuario = ROLES_USUARIO.includes(usuario.rol as RolUsuario)
      ? (usuario.rol as RolUsuario)
      : 'Paciente';

    const payload: Omit<JwtUserPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      role,
      pacienteId: usuario.paciente?.id ?? null,
    };

    const token = this.signToken(payload);

    return {
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role,
        pacienteId: usuario.paciente?.id ?? null,
      },
    };
  }

  async registerPaciente(dto: RegisterPacienteDto) {
    const emailNormalized = dto.email.toLowerCase().trim();
    const cedulaNormalized = dto.cedula.trim();

    const [existenteEmail, existenteCedula] = await Promise.all([
      prisma.usuario.findUnique({ where: { email: emailNormalized } }),
      prisma.paciente.findUnique({ where: { cedula: cedulaNormalized } }),
    ]);

    if (existenteEmail) {
      throw AppError.conflict('El correo electrónico ya se encuentra registrado.');
    }
    if (existenteCedula) {
      throw AppError.conflict('Ya existe un paciente registrado con esta cédula.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const nombreCompleto = `${dto.nombres.trim()} ${dto.apellidos.trim()}`;

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre: nombreCompleto,
          email: emailNormalized,
          passwordHash,
          rol: 'Paciente',
        },
      });

      const paciente = await tx.paciente.create({
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

      return { usuario, paciente };
    });

    const payload: Omit<JwtUserPayload, 'iat' | 'exp'> = {
      sub: resultado.usuario.id,
      id: resultado.usuario.id,
      email: resultado.usuario.email,
      nombre: resultado.usuario.nombre,
      role: 'Paciente',
      pacienteId: resultado.paciente.id,
    };

    const token = this.signToken(payload);

    return {
      token,
      user: {
        id: resultado.usuario.id,
        nombre: resultado.usuario.nombre,
        email: resultado.usuario.email,
        role: 'Paciente' as RolUsuario,
        pacienteId: resultado.paciente.id,
      },
      paciente: resultado.paciente,
    };
  }

  async getCurrentProfile(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { paciente: true },
    });

    if (!usuario || !usuario.activo) {
      throw AppError.unauthorized('Sesión inválida o usuario inactivo.');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.rol as RolUsuario,
      pacienteId: usuario.paciente?.id ?? null,
      paciente: usuario.paciente,
    };
  }
}

export const authService = new AuthService();
