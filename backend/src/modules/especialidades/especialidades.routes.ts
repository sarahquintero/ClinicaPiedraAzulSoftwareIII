import { Request, Response, Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const especialidades = await prisma.especialidad.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { medicos: true },
        },
      },
    });

    res.status(200).json({
      ok: true,
      total: especialidades.length,
      data: especialidades,
    });
  })
);

export const especialidadesRoutes = router;
