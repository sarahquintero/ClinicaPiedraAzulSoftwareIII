import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function buildFutureDate(daysAhead: number, hourUtcOffset5: number, minute = 0): Date {
  const base = new Date();
  base.setDate(base.getDate() + daysAhead);
  base.setHours(hourUtcOffset5, minute, 0, 0);
  return base;
}

async function main() {
  console.log('Iniciando seed de Clínica Piedra Azul...');

  // Limpieza idempotente respetando integridad referencial
  await prisma.cita.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.medico.deleteMany();
  await prisma.especialidad.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Especialidades médicas
  const [cardiologia, pediatria, medicinaInterna, dermatologia] = await Promise.all([
    prisma.especialidad.create({
      data: {
        nombre: 'Cardiología',
        descripcion: 'Diagnóstico, prevención y tratamiento de enfermedades cardiovasculares.',
        icono: 'heart-pulse',
      },
    }),
    prisma.especialidad.create({
      data: {
        nombre: 'Pediatría',
        descripcion: 'Atención integral para el crecimiento y desarrollo de niños y adolescentes.',
        icono: 'baby',
      },
    }),
    prisma.especialidad.create({
      data: {
        nombre: 'Medicina Interna',
        descripcion: 'Valoración integral de patologías crónicas y agudas en adultos.',
        icono: 'stethoscope',
      },
    }),
    prisma.especialidad.create({
      data: {
        nombre: 'Dermatología',
        descripcion: 'Salud y cuidado clínico especializado de la piel, cabello y uñas.',
        icono: 'sparkles',
      },
    }),
  ]);

  // 2. Médicos de planta
  const [draMontoya, drHerrera, draPineda, drCardenas] = await Promise.all([
    prisma.medico.create({
      data: {
        cedula: '1015428901',
        tarjetaProfesional: 'TP-48291-COL',
        nombres: 'Valeria',
        apellidos: 'Montoya Ríos',
        email: 'v.montoya@piedraazul.com',
        telefono: '3104567890',
        especialidadId: cardiologia.id,
        consultorio: 'Consultorio 204 - Torre Azul',
        diasAtencion: 'LUN,MAR,MIE,JUE,VIE',
        horaInicio: '08:00',
        horaFin: '16:00',
        biografia: 'Especialista en cardiología clínica y ecocardiografía con 12 años de experiencia.',
      },
    }),
    prisma.medico.create({
      data: {
        cedula: '79845123',
        tarjetaProfesional: 'TP-31904-COL',
        nombres: 'Sebastián',
        apellidos: 'Herrera Castro',
        email: 's.herrera@piedraazul.com',
        telefono: '3157891234',
        especialidadId: pediatria.id,
        consultorio: 'Consultorio 108 - Pabellón Infantil',
        diasAtencion: 'LUN,MIE,VIE',
        horaInicio: '07:30',
        horaFin: '15:30',
        biografia: 'Pediatra puericultor enfocado en medicina preventiva y control del desarrollo.',
      },
    }),
    prisma.medico.create({
      data: {
        cedula: '52901847',
        tarjetaProfesional: 'TP-55120-COL',
        nombres: 'Laura Sofía',
        apellidos: 'Pineda Salazar',
        email: 'l.pineda@piedraazul.com',
        telefono: '3206549870',
        especialidadId: medicinaInterna.id,
        consultorio: 'Consultorio 301 - Torre Azul',
        diasAtencion: 'LUN,MAR,MIE,JUE,VIE',
        horaInicio: '08:00',
        horaFin: '17:00',
        biografia: 'Internista dedicada al manejo integral de hipertensión, diabetes y chequeo ejecutivo.',
      },
    }),
    prisma.medico.create({
      data: {
        cedula: '1032487612',
        tarjetaProfesional: 'TP-62890-COL',
        nombres: 'Andrés Felipe',
        apellidos: 'Cárdenas Mejía',
        email: 'a.cardenas@piedraazul.com',
        telefono: '3009182736',
        especialidadId: dermatologia.id,
        consultorio: 'Consultorio 212 - Torre Azul',
        diasAtencion: 'MAR,JUE,SAB',
        horaInicio: '09:00',
        horaFin: '17:00',
        biografia: 'Dermatólogo clínico con énfasis en detección temprana y dermatoscopia digital.',
      },
    }),
  ]);

  // 3. Usuarios (1 Administrador y 2 Pacientes)
  const [adminPasswordHash, pacientePasswordHash] = await Promise.all([
    bcrypt.hash('Admin123*', 10),
    bcrypt.hash('Paciente123*', 10),
  ]);

  
  const adminUser = await prisma.usuario.create({
    data: {
      nombre: 'Dirección Médica - Admin',
      email: 'admin@piedraazul.com',
      passwordHash: adminPasswordHash,
      rol: 'Administrador',
    },
  });

  const pacienteCamilaUser = await prisma.usuario.create({
    data: {
      nombre: 'Camila Andrea Gómez Vargas',
      email: 'paciente@piedraazul.com',
      passwordHash: pacientePasswordHash,
      rol: 'Paciente',
    },
  });

  const pacienteCarlosUser = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Eduardo Ruiz Mendoza',
      email: 'carlos.ruiz@piedraazul.com',
      passwordHash: pacientePasswordHash,
      rol: 'Paciente',
    },
  });

  // 4. Perfiles de Pacientes vinculados
  const pacienteCamila = await prisma.paciente.create({
    data: {
      usuarioId: pacienteCamilaUser.id,
      tipoDocumento: 'CC',
      cedula: '1020304050',
      nombres: 'Camila Andrea',
      apellidos: 'Gómez Vargas',
      fechaNacimiento: new Date('1994-06-18T00:00:00.000Z'),
      genero: 'F',
      telefono: '3112345678',
      email: 'paciente@piedraazul.com',
      direccion: 'Cra. 15 # 84-24, Apto 502',
      grupoSanguineo: 'O+',
      alergias: 'Penicilina',
    },
  });

  const pacienteCarlos = await prisma.paciente.create({
    data: {
      usuarioId: pacienteCarlosUser.id,
      tipoDocumento: 'CC',
      cedula: '1098765432',
      nombres: 'Carlos Eduardo',
      apellidos: 'Ruiz Mendoza',
      fechaNacimiento: new Date('1988-11-03T00:00:00.000Z'),
      genero: 'M',
      telefono: '3187654321',
      email: 'carlos.ruiz@piedraazul.com',
      direccion: 'Calle 100 # 19-61',
      grupoSanguineo: 'A+',
      alergias: 'Ninguna conocida',
    },
  });

  // 5. Citas médicas (3 citas para Camila + 1 cita para Carlos)
  await prisma.cita.createMany({
    data: [
      {
        pacienteId: pacienteCamila.id,
        medicoId: draPineda.id,
        fechaHora: buildFutureDate(-7, 9, 0),
        duracionMinutos: 30,
        motivo: 'Chequeo médico anual y revisión de exámenes de laboratorio.',
        notas: 'Signos vitales estables. Se solicita control cardiológico preventivo.',
        estado: 'COMPLETADA',
        creadoPorId: adminUser.id,
      },
      {
        pacienteId: pacienteCamila.id,
        medicoId: draMontoya.id,
        fechaHora: buildFutureDate(3, 10, 30),
        duracionMinutos: 30,
        motivo: 'Valoración cardiológica preventiva remitida por medicina interna.',
        notas: 'Traer resultados de perfil lipídico reciente.',
        estado: 'PROGRAMADA',
        creadoPorId: pacienteCamilaUser.id,
      },
      {
        pacienteId: pacienteCamila.id,
        medicoId: drCardenas.id,
        fechaHora: buildFutureDate(7, 14, 0),
        duracionMinutos: 30,
        motivo: 'Control dermatológico anual y revisión de lunares.',
        estado: 'PROGRAMADA',
        creadoPorId: pacienteCamilaUser.id,
      },
      {
        pacienteId: pacienteCarlos.id,
        medicoId: drHerrera.id,
        fechaHora: buildFutureDate(4, 11, 0),
        duracionMinutos: 30,
        motivo: 'Orientación pediátrica familiar y esquema de vacunación.',
        estado: 'PROGRAMADA',
        creadoPorId: adminUser.id,
      },
    ],
  });

  console.log('✅ Seed completado con éxito:');
  console.log('   - Administrador: admin@piedraazul.com / Admin123*');
  console.log('   - Paciente 1 (3 citas): paciente@piedraazul.com / Paciente123* (Cédula: 1020304050)');
  console.log('   - Paciente 2 (1 cita):  carlos.ruiz@piedraazul.com / Paciente123* (Cédula: 1098765432)');
  console.log(`   - Médicos activos: 4 (${draMontoya.apellidos}, ${drHerrera.apellidos}, ${draPineda.apellidos}, ${drCardenas.apellidos})`);
}

main()
  .catch((error) => {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
