import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { citasRoutes } from './modules/citas/citas.routes';
import { especialidadesRoutes } from './modules/especialidades/especialidades.routes';
import { medicosRoutes } from './modules/medicos/medicos.routes';
import { pacientesRoutes } from './modules/pacientes/pacientes.routes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'Clínica Piedra Azul API',
      status: 'UP',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/especialidades', especialidadesRoutes);
  app.use('/api/medicos', medicosRoutes);
  app.use('/api/pacientes', pacientesRoutes);
  app.use('/api/citas', citasRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
