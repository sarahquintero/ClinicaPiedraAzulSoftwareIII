import { Router } from 'express';
import { checkRole, verifyToken } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate-request.middleware';
import {
  createPacienteController,
  listPacientesController,
  verificarCedulaController,
} from './pacientes.controller';
import { createPacienteAdminSchema } from './pacientes.schemas';

const router = Router();

// Ruta pública: verificación reactiva de disponibilidad de cédula
router.get('/verificar-cedula/:cedula', verificarCedulaController);

// Rutas de Administrador
router.get('/', verifyToken, checkRole(['Administrador']), listPacientesController);
router.post(
  '/',
  verifyToken,
  checkRole(['Administrador']),
  validateBody(createPacienteAdminSchema),
  createPacienteController
);

export const pacientesRoutes = router;
