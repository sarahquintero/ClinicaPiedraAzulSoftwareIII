import { Router } from 'express';
import { checkRole, verifyToken } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate-request.middleware';
import {
  createCitaAdminController,
  listAllCitasController,
  listMisCitasController,
  updateEstadoCitaController,
} from './citas.controller';
import {
  createCitaAdminSchema,
  updateEstadoCitaSchema,
} from './citas.schemas';

const router = Router();

// Rutas de Paciente (aisladas estrictamente a sus propias citas)
router.get('/mis-citas', verifyToken, checkRole(['Paciente']), listMisCitasController);

// Rutas de Administrador
router.get('/', verifyToken, checkRole(['Administrador']), listAllCitasController);
router.post(
  '/',
  verifyToken,
  checkRole(['Administrador']),
  validateBody(createCitaAdminSchema),
  createCitaAdminController
);
router.patch(
  '/:id/estado',
  verifyToken,
  checkRole(['Administrador']),
  validateBody(updateEstadoCitaSchema),
  updateEstadoCitaController
);

export const citasRoutes = router;
