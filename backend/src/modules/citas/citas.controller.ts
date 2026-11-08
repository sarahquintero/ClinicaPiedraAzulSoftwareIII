import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { citasService } from './citas.service';

export const listMisCitasController = asyncHandler(async (req: Request, res: Response) => {
  const citas = await citasService.listMisCitas(req.user!.sub);
  res.status(200).json({
    ok: true,
    total: citas.length,
    data: citas,
  });
});

export const listAllCitasController = asyncHandler(async (req: Request, res: Response) => {
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  const medicoId = typeof req.query.medicoId === 'string' ? req.query.medicoId : undefined;
  const pacienteId = typeof req.query.pacienteId === 'string' ? req.query.pacienteId : undefined;

  const citas = await citasService.listAll({ estado, medicoId, pacienteId });
  res.status(200).json({
    ok: true,
    total: citas.length,
    data: citas,
  });
});

export const createCitaAdminController = asyncHandler(async (req: Request, res: Response) => {
  const cita = await citasService.create(req.body, req.user!.sub);
  res.status(201).json({
    ok: true,
    message: 'Cita médica registrada exitosamente.',
    data: cita,
  });
});

export const updateEstadoCitaController = asyncHandler(async (req: Request, res: Response) => {
  const cita = await citasService.updateEstado(String(req.params.id), req.body);
  res.status(200).json({
    ok: true,
    message: 'Estado de la cita actualizado.',
    data: cita,
  });
});
