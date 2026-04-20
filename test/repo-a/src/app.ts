import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { loadAppConfig, configureLogger } from './config/app';
import { createLogger } from './utils/logger';

const logger = createLogger('App');

export function createApp(): Application {
  const config = loadAppConfig();
  configureLogger(config);

  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  const router = createRouter();
  app.use(router);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // Global error handler
  app.use(errorHandler);

  logger.info('Application configured', {
    env: config.env,
    corsOrigins: config.corsOrigins,
  });

  return app;
}
