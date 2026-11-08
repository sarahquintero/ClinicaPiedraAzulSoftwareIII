import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { authService } from './auth.service';

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json({
    ok: true,
    message: 'Autenticación exitosa.',
    ...result,
  });
});

export const registerPacienteController = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerPaciente(req.body);
  res.status(201).json({
    ok: true,
    message: 'Paciente registrado exitosamente.',
    ...result,
  });
});

export const meController = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentProfile(req.user!.sub);
  res.status(200).json({
    ok: true,
    user,
  });
});
