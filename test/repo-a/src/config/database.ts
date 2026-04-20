import { Logger, createLogger } from '../utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}

export class DatabaseConnection {
  private config: DatabaseConfig;
  private logger: Logger;
  private connected: boolean = false;
  private static instance: DatabaseConnection | null = null;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = createLogger('DatabaseConnection');
  }

  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) throw new Error('Database config required for first initialization');
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      this.logger.warn('Already connected to database');
      return;
    }
    this.logger.info('Connecting to database', {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
    });
    // Simulated connection
    this.connected = true;
    this.logger.info('Database connection established');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.logger.info('Disconnecting from database');
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): Readonly<DatabaseConfig> {
    return Object.freeze({ ...this.config });
  }
}

export function createDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'taskmanager',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  };
}
