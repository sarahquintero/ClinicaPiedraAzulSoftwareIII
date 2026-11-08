import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate-request.middleware';
import { loginController, meController, registerPacienteController } from './auth.controller';
import { loginSchema, registerPacienteSchema } from './auth.schemas';

const router = Router();

router.post('/login', validateBody(loginSchema), loginController);
router.post('/register', validateBody(registerPacienteSchema), registerPacienteController);
router.get('/me', verifyToken, meController);

export const authRoutes = router;
