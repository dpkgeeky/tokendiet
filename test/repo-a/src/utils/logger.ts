export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export class Logger {
  private context: string;
  private static globalLevel: LogLevel = LogLevel.INFO;

  constructor(context: string) {
    this.context = context;
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static getGlobalLevel(): LogLevel {
    return Logger.globalLevel;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorMeta = error
      ? { ...meta, errorMessage: error.message, stack: error.stack }
      : meta;
    this.log(LogLevel.ERROR, message, errorMeta);
  }

  fatal(message: string, error?: Error): void {
    this.log(LogLevel.FATAL, message, {
      errorMessage: error?.message,
      stack: error?.stack,
    });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (level < Logger.globalLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const entry = {
      timestamp,
      level: levelName,
      context: this.context,
      message,
      ...meta,
    };

    if (level >= LogLevel.ERROR) {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
