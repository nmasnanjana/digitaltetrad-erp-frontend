/* eslint-disable no-console -- Allow */

// NOTE: A tracking system such as Sentry should replace the console

export const LogLevel = { NONE: 'NONE', ERROR: 'ERROR', WARN: 'WARN', DEBUG: 'DEBUG', ALL: 'ALL' } as const;

const LogLevelNumber = { NONE: 0, ERROR: 1, WARN: 2, DEBUG: 3, ALL: 4 } as const;

export interface LoggerOptions {
  prefix?: string;
  level?: keyof typeof LogLevel;
  showLevel?: boolean;
}

export class Logger {
  protected prefix: string;
  protected level: keyof typeof LogLevel;
  protected showLevel: boolean;
  private levelNumber: number;

  constructor({ prefix = '', level = LogLevel.ALL, showLevel = true }: LoggerOptions) {
    this.prefix = prefix;
    this.level = level;
    this.levelNumber = LogLevelNumber[this.level];
    this.showLevel = showLevel;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.canWrite(LogLevel.DEBUG)) {
      this.write(LogLevel.DEBUG, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.canWrite(LogLevel.ALL)) {
      this.write(LogLevel.ALL, message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.canWrite(LogLevel.WARN)) {
      this.write(LogLevel.WARN, message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.canWrite(LogLevel.ERROR)) {
      this.write(LogLevel.ERROR, message, ...args);
    }
  }

  private canWrite(level: keyof typeof LogLevel): boolean {
    return this.levelNumber >= LogLevelNumber[level];
  }

  private write(level: keyof typeof LogLevel, message: string, ...args: unknown[]): void {
    let prefix = this.prefix;

    if (this.showLevel) {
      prefix = `[${level}] ${prefix}`;
    }

    if (level === LogLevel.ERROR) {
      console.error(prefix, message, ...args);
    } else if (level === LogLevel.WARN) {
      console.warn(prefix, message, ...args);
    } else if (level === LogLevel.DEBUG) {
      console.debug(prefix, message, ...args);
    } else {
      console.info(prefix, message, ...args);
    }
  }
}

// This can be extended to create context specific logger (Server Action, Router Handler, etc.)
// to add context information (IP, User-Agent, timestamp, etc.)

export function createLogger({ prefix, level }: LoggerOptions = {}): Logger {
  return new Logger({ prefix, level });
}

export const logger = new Logger({});
