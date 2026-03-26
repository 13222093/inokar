import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const portfolioRouter = Router();

portfolioRouter.get('/distribution', async (_req: Request, res: Response) => {
  const [highLiquidity, underReview, riskWarning] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.property.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.property.count({ where: { status: 'RISK_DETECTED' } }),
  ]);

  res.json({
    success: true,
    data: { highLiquidity, underReview, riskWarning },
  });
});
