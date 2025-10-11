import { config } from './config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!config.DEBUG && level === 'debug') return false;
    if (config.NODE_ENV === 'test') return false;
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(config.NODE_ENV === 'development' && { env: 'dev' })
    };

    const method = level === 'debug' ? 'log' : level;
    console[method](`[${timestamp}] ${level.toUpperCase()}: ${message}`, context || '');
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    let errorContext: LogContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: config.DEBUG ? error.stack : undefined
      };
    } else if (error && typeof error === 'object') {
      errorContext.errorData = error;
    }

    this.formatMessage('error', message, errorContext);
  }
}

export const logger = new Logger();

// 便捷导出
export const { debug, info, warn, error } = logger;