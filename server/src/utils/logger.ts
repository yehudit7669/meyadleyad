/**
 * Central Logger Utility
 * Production-ready structured logging system
 */

import { config } from '../config';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

/**
 * Sanitize sensitive data from log context
 */
const sanitizeContext = (context: LogContext): LogContext => {
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'cvv',
    'ssn',
  ];

  const partialMaskFields = ['email', 'phone', 'licenseNumber'];

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    // Remove sensitive fields completely
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Partially mask fields
    if (partialMaskFields.some((field) => key.toLowerCase().includes(field))) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = value.replace(/(.{2}).*(@.{2}).*(\..*)/, '$1***$2***$3');
        } else {
          sanitized[key] = value.substring(0, 2) + '***' + value.substring(value.length - 2);
        }
      } else {
        sanitized[key] = value;
      }
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' ? sanitizeContext(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Format log entry for output
 */
const formatLogEntry = (entry: LogEntry): string => {
  if (config.nodeEnv === 'production') {
    // Production: JSON format for log aggregation
    return JSON.stringify(entry);
  } else {
    // Development: Human-readable format
    const { timestamp, level, message, context, stack } = entry;
    let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (stack) {
      output += `\n  Stack: ${stack}`;
    }

    return output;
  }
};

/**
 * Core logging function
 */
const log = (level: LogLevel, message: string, context?: LogContext): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitizeContext(context) : undefined,
  };

  const formatted = formatLogEntry(entry);

  switch (level) {
    case LogLevel.DEBUG:
      if (config.nodeEnv === 'development') {
        console.debug(formatted);
      }
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
      console.error(formatted);
      break;
  }
};

/**
 * Logger class with convenience methods
 */
class Logger {
  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext): void {
    log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level - something unexpected but not critical
   */
  warn(message: string, context?: LogContext): void {
    log(LogLevel.WARN, message, context);
  }

  /**
   * Error level - errors that need attention
   */
  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    let logContext = context || {};
    let stack: string | undefined;

    if (error instanceof Error) {
      stack = error.stack;
      logContext = {
        ...logContext,
        errorName: error.name,
        errorMessage: error.message,
      };
    } else if (error) {
      logContext = { ...logContext, ...error };
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: sanitizeContext(logContext),
      stack,
    };

    const formatted = formatLogEntry(entry);
    console.error(formatted);
  }

  /**
   * Log HTTP request
   */
  request(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, {
      type: 'HTTP_REQUEST',
      method,
      url,
      ...context,
    });
  }

  /**
   * Log HTTP response
   */
  response(method: string, url: string, statusCode: number, duration: number): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    log(level, `${method} ${url} - ${statusCode} (${duration}ms)`, {
      type: 'HTTP_RESPONSE',
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Log authentication event
   */
  auth(event: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, {
      type: 'AUTH_EVENT',
      event,
      ...context,
    });
  }

  /**
   * Log admin action
   */
  admin(action: string, context?: LogContext): void {
    this.info(`Admin: ${action}`, {
      type: 'ADMIN_ACTION',
      action,
      ...context,
    });
  }

  /**
   * Log database operation
   */
  database(operation: string, table: string, duration?: number, context?: LogContext): void {
    const message = `DB: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`;
    
    if (duration && duration > 1000) {
      this.warn(message, {
        type: 'SLOW_QUERY',
        operation,
        table,
        duration,
        ...context,
      });
    } else {
      this.debug(message, {
        type: 'DATABASE_OPERATION',
        operation,
        table,
        duration,
        ...context,
      });
    }
  }

  /**
   * Log email event
   */
  email(event: string, to: string, success: boolean, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    log(level, `Email: ${event} to ${to} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      type: 'EMAIL_EVENT',
      event,
      to,
      success,
      ...context,
    });
  }

  /**
   * Log WhatsApp event
   */
  whatsapp(event: string, to: string, success: boolean, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    log(level, `WhatsApp: ${event} to ${to} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      type: 'WHATSAPP_EVENT',
      event,
      to,
      success,
      ...context,
    });
  }

  /**
   * Log PDF generation
   */
  pdf(event: string, success: boolean, duration?: number, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    log(level, `PDF: ${event} - ${success ? 'SUCCESS' : 'FAILED'}${duration ? ` (${duration}ms)` : ''}`, {
      type: 'PDF_EVENT',
      event,
      success,
      duration,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other modules
export type { LogContext };
