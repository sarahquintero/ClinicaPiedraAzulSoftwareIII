import { Router } from 'express';
import { checkRole, verifyToken } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate-request.middleware';
import {
  createMedicoController,
  listMedicosAdminController,
  listMedicosPublicController,
  toggleEstadoMedicoController,
} from './medicos.controller';
import { createMedicoSchema, toggleEstadoMedicoSchema } from './medicos.schemas';

const router = Router();

// Ruta pública: catálogo de médicos activos para consumo del portal y formularios reactivos
router.get('/', listMedicosPublicController);

// Rutas de Administrador
router.get('/admin', verifyToken, checkRole(['Administrador']), listMedicosAdminController);
router.post(
  '/',
  verifyToken,
  checkRole(['Administrador']),
  validateBody(createMedicoSchema),
  createMedicoController
);
router.patch(
  '/:id/estado',
  verifyToken,
  checkRole(['Administrador']),
  validateBody(toggleEstadoMedicoSchema),
  toggleEstadoMedicoController
);

export const medicosRoutes = router;
