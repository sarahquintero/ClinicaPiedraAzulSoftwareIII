-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'Paciente',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Medico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cedula" TEXT NOT NULL,
    "tarjetaProfesional" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "especialidadId" TEXT NOT NULL,
    "consultorio" TEXT NOT NULL,
    "diasAtencion" TEXT NOT NULL DEFAULT 'LUN,MAR,MIE,JUE,VIE',
    "horaInicio" TEXT NOT NULL DEFAULT '08:00',
    "horaFin" TEXT NOT NULL DEFAULT '17:00',
    "biografia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Medico_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "Especialidad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "tipoDocumento" TEXT NOT NULL DEFAULT 'CC',
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" DATETIME NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "direccion" TEXT,
    "grupoSanguineo" TEXT,
    "alergias" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Paciente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 30,
    "motivo" TEXT NOT NULL,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PROGRAMADA',
    "creadoPorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cita_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Medico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cita_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_cedula_key" ON "Medico"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_tarjetaProfesional_key" ON "Medico"("tarjetaProfesional");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_email_key" ON "Medico"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_usuarioId_key" ON "Paciente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cedula_key" ON "Paciente"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_email_key" ON "Paciente"("email");

-- CreateIndex
CREATE INDEX "Cita_medicoId_fechaHora_idx" ON "Cita"("medicoId", "fechaHora");

-- CreateIndex
CREATE INDEX "Cita_pacienteId_fechaHora_idx" ON "Cita"("pacienteId", "fechaHora");
