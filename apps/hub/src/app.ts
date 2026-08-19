import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import { errorHandler } from './middleware/error.middleware';

// Import route handlers
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import reportRoutes from './routes/report.routes';
import blocklistRoutes from './routes/blocklist.routes';
import sseRoutes from './routes/sse.routes';
import heartbeatRoutes from './routes/heartbeat.routes';
import statsRoutes from './routes/stats.routes';
import membersRoutes from './routes/members.routes';
import allowlistRoutes from './routes/allowlist.routes';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.set('trust proxy', true);

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Concise request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      // Don't flood logs with ping requests if any
      if (req.path !== '/v1/events') {
        const duration = Date.now() - start;
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`
        );
      }
    });
    next();
  });

  // Base and Health Routes
  app.use('/health', healthRoutes);
  app.use('/v1/health', healthRoutes);

  // API v1 Routes
  app.use('/v1/auth', authRoutes);
  app.use('/v1/report', reportRoutes);
  app.use('/v1/blocklist', blocklistRoutes);
  app.use('/v1/events', sseRoutes);
  app.use('/v1/heartbeat', heartbeatRoutes);
  app.use('/v1/stats', statsRoutes);
  app.use('/v1/members', membersRoutes);
  app.use('/v1/allowlist', allowlistRoutes);

  // Root welcome index
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'NexusSecure Hub Coordinator',
      description: 'Collaborative Attack-Defense Threat Intelligence Mesh',
      version: config.version,
      docs: {
        health: '/health',
        blocklist: '/v1/blocklist',
        networkStats: '/v1/stats/network',
        events: '/v1/events',
      },
    });
  });

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
