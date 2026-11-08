import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { pacientesService } from './pacientes.service';

export const verificarCedulaController = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await pacientesService.verificarCedula(String(req.params.cedula ?? ''));
  res.status(200).json({
    ok: true,
    ...resultado,
  });
});

export const listPacientesController = asyncHandler(async (_req: Request, res: Response) => {
  const pacientes = await pacientesService.listAll();
  res.status(200).json({
    ok: true,
    total: pacientes.length,
    data: pacientes,
  });
});

export const createPacienteController = asyncHandler(async (req: Request, res: Response) => {
  const paciente = await pacientesService.create(req.body);
  res.status(201).json({
    ok: true,
    message: 'Paciente registrado exitosamente.',
    data: paciente,
  });
});
