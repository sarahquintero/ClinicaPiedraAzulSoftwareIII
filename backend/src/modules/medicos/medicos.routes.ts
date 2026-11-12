import { Router } from 'express';
import { checkRole, verifyToken } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate-request.middleware';
import {
  createMedicoController,
  listMedicosAdminController,
  listMedicosPublicController,
  toggleEstadoMedicoController,
  verificarTarjetaController,
} from './medicos.controller';
import { createMedicoSchema, toggleEstadoMedicoSchema } from './medicos.schemas';

const router = Router();

// Rutas públicas: verificación reactiva de tarjeta profesional y catálogo de médicos activos
router.get('/verificar-tarjeta/:tarjeta', verificarTarjetaController);
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
