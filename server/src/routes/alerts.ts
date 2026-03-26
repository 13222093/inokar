import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const alertsRouter = Router();

alertsRouter.get('/', async (_req: Request, res: Response) => {
  const alerts = await prisma.riskAlert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: 'desc' },
    include: { property: { select: { name: true, city: true } } },
  });
  res.json({ success: true, data: alerts });
});

alertsRouter.patch('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const alert = await prisma.riskAlert.update({
      where: { id: req.params.id },
      data: { resolved: true },
    });
    res.json({ success: true, data: alert });
  } catch {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
  }
});
