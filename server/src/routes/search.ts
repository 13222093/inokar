import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    res.json({ success: true, data: [] });
    return;
  }

  const results = await prisma.property.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { smeName: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, city: true, state: true, liquidityScore: true, status: true },
    take: 20,
  });

  res.json({ success: true, data: results });
});
