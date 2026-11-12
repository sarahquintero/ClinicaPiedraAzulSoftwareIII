import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { medicosService } from './medicos.service';

export const verificarTarjetaController = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await medicosService.verificarTarjeta(String(req.params.tarjeta ?? ''));
  res.status(200).json({
    ok: true,
    ...resultado,
  });
});

export const listMedicosPublicController = asyncHandler(async (req: Request, res: Response) => {
  const especialidadId =
    typeof req.query.especialidadId === 'string' ? req.query.especialidadId : undefined;
  const especialidad =
    typeof req.query.especialidad === 'string' ? req.query.especialidad : undefined;

  const medicos = await medicosService.listPublic({ especialidadId, especialidad });
  res.status(200).json({
    ok: true,
    total: medicos.length,
    data: medicos,
  });
});

export const listMedicosAdminController = asyncHandler(async (_req: Request, res: Response) => {
  const medicos = await medicosService.listAdmin();
  res.status(200).json({
    ok: true,
    total: medicos.length,
    data: medicos,
  });
});

export const createMedicoController = asyncHandler(async (req: Request, res: Response) => {
  const medico = await medicosService.create(req.body);
  res.status(201).json({
    ok: true,
    message: 'Médico registrado exitosamente.',
    data: medico,
  });
});

export const toggleEstadoMedicoController = asyncHandler(async (req: Request, res: Response) => {
  const medico = await medicosService.toggleActivo(String(req.params.id), req.body.activo);
  res.status(200).json({
    ok: true,
    message: 'Estado del médico actualizado.',
    data: medico,
  });
});
