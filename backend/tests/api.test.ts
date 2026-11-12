import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('Clínica Piedra Azul — Fase 1 Backend (Auth JWT, RBAC y Endpoints Base)', () => {
  let adminToken = '';
  let pacienteToken = '';
  let nuevoMedicoId = '';
  let nuevoPacienteId = '';
  const sufijoUnico = Date.now().toString().slice(-6);
  const cedulaNuevoPaciente = `80${sufijoUnico}`;
  const cedulaNuevoMedico = `70${sufijoUnico}`;

  it('GET /api/health responde 200 y estado UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe('UP');
  });

  describe('Rutas Públicas', () => {
    it('GET /api/medicos devuelve catálogo público sin requerir token', async () => {
      const res = await request(app).get('/api/medicos');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data[0]).toHaveProperty('especialidad');
    });

    it('GET /api/pacientes/verificar-cedula/:cedula detecta cédula ocupada y cédula disponible', async () => {
      const ocupada = await request(app).get('/api/pacientes/verificar-cedula/1020304050');
      expect(ocupada.status).toBe(200);
      expect(ocupada.body.existe).toBe(true);
      expect(ocupada.body.disponible).toBe(false);

      const libre = await request(app).get(`/api/pacientes/verificar-cedula/${cedulaNuevoPaciente}`);
      expect(libre.status).toBe(200);
      expect(libre.body.existe).toBe(false);
      expect(libre.body.disponible).toBe(true);
    });

    it('GET /api/medicos/verificar-tarjeta/:tarjeta detecta tarjeta profesional ocupada y disponible', async () => {
      const ocupada = await request(app).get('/api/medicos/verificar-tarjeta/TP-48291-COL');
      expect(ocupada.status).toBe(200);
      expect(ocupada.body.existe).toBe(true);
      expect(ocupada.body.disponible).toBe(false);

      const libre = await request(app).get(`/api/medicos/verificar-tarjeta/TP-${sufijoUnico}`);
      expect(libre.status).toBe(200);
      expect(libre.body.existe).toBe(false);
      expect(libre.body.disponible).toBe(true);
    });
  });

  describe('POST /api/auth/login y estructura del JWT', () => {
    it('rechaza credenciales incorrectas con 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@piedraazul.com',
        password: 'ClaveIncorrecta999',
      });
      expect(res.status).toBe(401);
    });

    it('autentica Administrador y emite JWT con role = Administrador', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@piedraazul.com',
        password: 'Admin123*',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      adminToken = res.body.token;

      const decoded = jwt.decode(adminToken) as { role?: string; email?: string };
      expect(decoded.role).toBe('Administrador');
      expect(decoded.email).toBe('admin@piedraazul.com');
    });

    it('autentica Paciente y emite JWT con role = Paciente', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'paciente@piedraazul.com',
        password: 'Paciente123*',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      pacienteToken = res.body.token;

      const decoded = jwt.decode(pacienteToken) as { role?: string; pacienteId?: string };
      expect(decoded.role).toBe('Paciente');
      expect(decoded.pacienteId).toBeTruthy();
    });
  });

  describe('Middleware verifyToken (401 Unauthorized)', () => {
    it('devuelve 401 cuando no se envía encabezado Authorization', async () => {
      const [r1, r2, r3] = await Promise.all([
        request(app).get('/api/citas/mis-citas'),
        request(app).get('/api/pacientes'),
        request(app).get('/api/medicos/admin'),
      ]);
      expect(r1.status).toBe(401);
      expect(r2.status).toBe(401);
      expect(r3.status).toBe(401);
    });

    it('devuelve 401 cuando el token Bearer es inválido o manipulado', async () => {
      const res = await request(app)
        .get('/api/citas')
        .set('Authorization', 'Bearer token.falso.invalido');
      expect(res.status).toBe(401);
    });
  });

  describe('Middleware checkRole (403 Forbidden)', () => {
    it('bloquea con 403 a un Paciente que intenta acceder a rutas de Administrador', async () => {
      const respuestas = await Promise.all([
        request(app).get('/api/medicos/admin').set('Authorization', `Bearer ${pacienteToken}`),
        request(app).post('/api/medicos').set('Authorization', `Bearer ${pacienteToken}`).send({}),
        request(app).get('/api/pacientes').set('Authorization', `Bearer ${pacienteToken}`),
        request(app).post('/api/pacientes').set('Authorization', `Bearer ${pacienteToken}`).send({}),
        request(app).get('/api/citas').set('Authorization', `Bearer ${pacienteToken}`),
        request(app).post('/api/citas').set('Authorization', `Bearer ${pacienteToken}`).send({}),
      ]);

      for (const r of respuestas) {
        expect(r.status).toBe(403);
      }
    });

    it('bloquea con 403 a un Administrador en la ruta exclusiva de Paciente /api/citas/mis-citas', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Rutas de Paciente', () => {
    it('GET /api/citas/mis-citas devuelve únicamente las citas propias del paciente autenticado', async () => {
      const res = await request(app)
        .get('/api/citas/mis-citas')
        .set('Authorization', `Bearer ${pacienteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      for (const cita of res.body.data) {
        expect(cita.paciente.cedula).toBe('1020304050');
      }
    });
  });

  describe('Rutas de Administrador', () => {
    it('POST /api/medicos y GET /api/medicos/admin registran y consultan médicos', async () => {
      const createRes = await request(app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cedula: cedulaNuevoMedico,
          tarjetaProfesional: `TP-${sufijoUnico}`,
          nombres: 'Mauricio',
          apellidos: 'Salgado Vélez',
          email: `m.salgado.${sufijoUnico}@piedraazul.com`,
          telefono: '3145556677',
          especialidad: 'Neurología',
          consultorio: 'Consultorio 405 - Torre Azul',
          diasAtencion: 'LUN,MIE,VIE',
          horaInicio: '08:00',
          horaFin: '16:00',
        });

      expect(createRes.status).toBe(201);
      nuevoMedicoId = createRes.body.data.id;

      const adminList = await request(app)
        .get('/api/medicos/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.data.some((m: { id: string }) => m.id === nuevoMedicoId)).toBe(true);

      const checkTarjeta = await request(app).get(
        `/api/medicos/verificar-tarjeta/TP-${sufijoUnico}`
      );
      expect(checkTarjeta.status).toBe(200);
      expect(checkTarjeta.body.existe).toBe(true);
      expect(checkTarjeta.body.disponible).toBe(false);
    });

    it('POST /api/pacientes y GET /api/pacientes registran y consultan pacientes', async () => {
      const createRes = await request(app)
        .post('/api/pacientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipoDocumento: 'CC',
          cedula: cedulaNuevoPaciente,
          nombres: 'Mariana',
          apellidos: 'Ospina Duarte',
          fechaNacimiento: '1997-04-12',
          genero: 'F',
          telefono: '3168889900',
          email: `mariana.${sufijoUnico}@correo.com`,
          direccion: 'Av. Piedra Azul # 45-10',
          grupoSanguineo: 'B+',
        });

      expect(createRes.status).toBe(201);
      nuevoPacienteId = createRes.body.data.id;

      const listRes = await request(app)
        .get('/api/pacientes')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some((p: { id: string }) => p.id === nuevoPacienteId)).toBe(true);

      const checkCedula = await request(app).get(
        `/api/pacientes/verificar-cedula/${cedulaNuevoPaciente}`
      );
      expect(checkCedula.body.existe).toBe(true);
      expect(checkCedula.body.disponible).toBe(false);
    });

    it('POST /api/citas agenda cita médica, previene solapamiento (409) y GET /api/citas lista agenda global', async () => {
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 10);
      fechaFutura.setHours(11, 0, 0, 0);
      const fechaIso = fechaFutura.toISOString();

      const createCita = await request(app)
        .post('/api/citas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pacienteId: nuevoPacienteId,
          medicoId: nuevoMedicoId,
          fechaHora: fechaIso,
          duracionMinutos: 30,
          motivo: 'Valoración neurológica por cefalea tensional recurrente.',
        });

      expect(createCita.status).toBe(201);

      // Intento de doble agendamiento en el mismo bloque horario debe devolver 409 Conflict
      const solapada = await request(app)
        .post('/api/citas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pacienteId: nuevoPacienteId,
          medicoId: nuevoMedicoId,
          fechaHora: fechaIso,
          duracionMinutos: 30,
          motivo: 'Intento duplicado en la misma hora.',
        });
      expect(solapada.status).toBe(409);

      const listGlobal = await request(app)
        .get('/api/citas')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listGlobal.status).toBe(200);
      expect(listGlobal.body.total).toBeGreaterThanOrEqual(5);
    });
  });
});
