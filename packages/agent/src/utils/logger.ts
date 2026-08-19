/**
 * NexusSecure Agent - Zero-Overhead Configurable Logger
 */
import { LoggerInterface, LogLevel } from '../types.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  none: 100,
};

export class Logger implements LoggerInterface {
  private levelValue: number;
  private customLogger?: LoggerInterface;
  private prefix: string;

  constructor(level: LogLevel = 'info', customLogger?: LoggerInterface, prefix = '[NexusSecure]') {
    this.levelValue = LOG_LEVELS[level] ?? LOG_LEVELS.info;
    this.customLogger = customLogger;
    this.prefix = prefix;
  }

  public setLevel(level: LogLevel): void {
    this.levelValue = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  }

  public debug(message: string, ...args: any[]): void {
    if (this.levelValue <= LOG_LEVELS.debug) {
      if (this.customLogger) {
        this.customLogger.debug(`${this.prefix} ${message}`, ...args);
      } else {
        console.debug(`${this.prefix} [DEBUG] ${message}`, ...args);
      }
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.levelValue <= LOG_LEVELS.info) {
      if (this.customLogger) {
        this.customLogger.info(`${this.prefix} ${message}`, ...args);
      } else {
        console.info(`${this.prefix} [INFO] ${message}`, ...args);
      }
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.levelValue <= LOG_LEVELS.warn) {
      if (this.customLogger) {
        this.customLogger.warn(`${this.prefix} ${message}`, ...args);
      } else {
        console.warn(`${this.prefix} [WARN] ${message}`, ...args);
      }
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.levelValue <= LOG_LEVELS.error) {
      if (this.customLogger) {
        this.customLogger.error(`${this.prefix} ${message}`, ...args);
      } else {
        console.error(`${this.prefix} [ERROR] ${message}`, ...args);
      }
    }
  }
}
