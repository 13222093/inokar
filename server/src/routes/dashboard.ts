import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (_req: Request, res: Response) => {
  const properties = await prisma.property.findMany({
    select: { marketValue: true, liquidityScore: true, timeToLiquidity: true },
  });

  const total = properties.length;
  const portfolioValue = properties.reduce((sum, p) => sum + p.marketValue, 0);
  const avgLiquidity = total > 0 ? properties.reduce((sum, p) => sum + (p.liquidityScore ?? 0), 0) / total : 0;
  const avgTimeToSell = total > 0
    ? Math.round(properties.filter(p => p.timeToLiquidity).reduce((s, p) => s + (p.timeToLiquidity ?? 0), 0) / properties.filter(p => p.timeToLiquidity).length)
    : 0;

  res.json({
    success: true,
    data: {
      liquidityScore: Math.round(avgLiquidity * 10) / 10,
      portfolioValue,
      avgTimeToSell,
      assetCount: total,
    },
  });
});

dashboardRouter.get('/recent-requests', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

  const [data, total] = await Promise.all([
    prisma.scoreRequest.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { name: true, address: true, city: true, smeName: true } } },
    }),
    prisma.scoreRequest.count(),
  ]);

  res.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});
