import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export const propertiesRouter = Router();

propertiesRouter.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const sort = req.query.sort as string || 'liquidityScore';
  const status = req.query.status as string;
  const region = req.query.region as string;

  const where: Prisma.PropertyWhereInput = {};
  if (status) where.status = status as any;
  if (region) where.country = { contains: region, mode: 'insensitive' };

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === 'value' ? { marketValue: 'desc' } :
    sort === 'recent' ? { updatedAt: 'desc' } :
    { liquidityScore: 'desc' };

  const [data, total] = await Promise.all([
    prisma.property.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.property.count({ where }),
  ]);

  res.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

propertiesRouter.get('/:id', async (req: Request, res: Response) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: {
      assessments: { orderBy: { createdAt: 'desc' } },
      riskAlerts: { where: { resolved: false }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!property) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
    return;
  }
  res.json({ success: true, data: property });
});

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  propertyType: z.enum(['COMMERCIAL', 'RESIDENTIAL', 'INDUSTRIAL', 'MIXED_USE']),
  marketValue: z.number().positive(),
  smeName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  userId: z.string(),
});

propertiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    const property = await prisma.property.create({ data: body as any });
    res.status(201).json({ success: true, data: property });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: err.errors } });
      return;
    }
    throw err;
  }
});

propertiesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: property });
  } catch {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
  }
});

propertiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Property deleted' } });
  } catch {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Property not found' } });
  }
});
