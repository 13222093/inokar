import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const riskRouter = Router();

riskRouter.get('/metrics', async (_req: Request, res: Response) => {
  const properties = await prisma.property.findMany({
    select: { liquidityScore: true, marketValue: true },
  });
  const total = properties.length || 1;
  const avgHealth = properties.reduce((s, p) => s + (p.liquidityScore ?? 0), 0) / total;
  const totalExposure = properties.reduce((s, p) => s + p.marketValue, 0);
  const unresolvedAlerts = await prisma.riskAlert.count({ where: { resolved: false } });
  const liquidReserve = total > 0
    ? (properties.filter(p => (p.liquidityScore ?? 0) > 70).length / total) * 100
    : 0;

  res.json({
    success: true,
    data: {
      portfolioHealth: Math.round(avgHealth * 10) / 10,
      marketExposure: totalExposure,
      liquidReserve: Math.round(liquidReserve * 10) / 10,
      systemUptime: 99.9,
      unresolvedAlerts,
    },
  });
});

riskRouter.get('/high-risk-assets', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));

  const where = { resolved: false };
  const [data, total] = await Promise.all([
    prisma.riskAlert.findMany({
      where,
      orderBy: { delta: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { property: { select: { name: true, city: true, state: true } } },
    }),
    prisma.riskAlert.count({ where }),
  ]);

  res.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

riskRouter.get('/hotspots', async (_req: Request, res: Response) => {
  const alerts = await prisma.riskAlert.findMany({
    where: { resolved: false },
    include: { property: { select: { name: true, lat: true, lng: true } } },
    distinct: ['propertyId'],
    orderBy: { delta: 'asc' },
    take: 20,
  });

  const hotspots = alerts.map(a => ({
    name: a.property.name,
    lat: a.property.lat,
    lng: a.property.lng,
    riskLevel: Math.abs(a.delta) > 10 ? 'high' : Math.abs(a.delta) > 5 ? 'medium' : 'low',
    delta: a.delta,
    type: a.type,
  }));

  res.json({ success: true, data: hotspots });
});
