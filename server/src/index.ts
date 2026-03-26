import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config.js';
import { dashboardRouter } from './routes/dashboard.js';
import { propertiesRouter } from './routes/properties.js';
import { portfolioRouter } from './routes/portfolio.js';
import { riskRouter } from './routes/risk.js';
import { alertsRouter } from './routes/alerts.js';
import { searchRouter } from './routes/search.js';
import { authRouter } from './routes/auth.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/risk', riskRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/search', searchRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

app.listen(env.PORT, () => {
  console.log(`🚀 LiqUIFI API running on http://localhost:${env.PORT}`);
});

export default app;
