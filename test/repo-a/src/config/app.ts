import { LogLevel, Logger } from '../utils/logger';

export interface AppConfig {
  port: number;
  host: string;
  env: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  corsOrigins: string[];
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export function loadAppConfig(): AppConfig {
  const env = (process.env.NODE_ENV || 'development') as AppConfig['env'];

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    env,
    logLevel: env === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  };
}

export function validateAppConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  if (config.env === 'production' && config.jwtSecret === 'dev-secret-change-me') {
    errors.push('JWT_SECRET must be set in production');
  }
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  if (config.rateLimitMax < 1) {
    errors.push('RATE_LIMIT_MAX must be positive');
  }

  return errors;
}

export function configureLogger(config: AppConfig): void {
  Logger.setGlobalLevel(config.logLevel);
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
