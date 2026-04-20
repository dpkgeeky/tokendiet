import { createApp } from './app';
import { DatabaseConnection, createDatabaseConfig } from './config/database';
import { loadAppConfig, validateAppConfig } from './config/app';
import { createLogger } from './utils/logger';

const logger = createLogger('Main');

async function bootstrap(): Promise<void> {
  // Load and validate config
  const appConfig = loadAppConfig();
  const configErrors = validateAppConfig(appConfig);

  if (configErrors.length > 0) {
    logger.fatal(new Error('Invalid configuration'), undefined);
    configErrors.forEach((err) => logger.error(err));
    process.exit(1);
  }

  // Connect to database
  const dbConfig = createDatabaseConfig();
  const db = DatabaseConnection.getInstance(dbConfig);

  try {
    await db.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.fatal(new Error('Failed to connect to database'), error as Error);
    process.exit(1);
  }

  // Create and start Express app
  const app = createApp();

  const server = app.listen(appConfig.port, appConfig.host, () => {
    logger.info(`Server running at http://${appConfig.host}:${appConfig.port}`, {
      env: appConfig.env,
      port: appConfig.port,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    server.close(async () => {
      await db.disconnect();
      logger.info('Server shut down complete');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
