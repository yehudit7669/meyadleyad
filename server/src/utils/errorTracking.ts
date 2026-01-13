/**
 * Error Tracking Integration (Sentry-ready)
 * Environment-based error tracking setup
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/node @sentry/profiling-node
 * 2. Set SENTRY_DSN in .env
 * 3. Uncomment Sentry initialization code
 */

import { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

// Uncomment when Sentry packages are installed
// import * as Sentry from '@sentry/node';
// import { ProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize error tracking
 */
export const initErrorTracking = (_app: Application): void => {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    logger.info('Sentry DSN not configured - error tracking disabled', {
      type: 'ERROR_TRACKING_INIT',
      enabled: false,
    });
    return;
  }

  logger.info('Initializing Sentry error tracking', {
    type: 'ERROR_TRACKING_INIT',
    environment: config.nodeEnv,
  });

  // Uncomment when Sentry packages are installed
  /*
  Sentry.init({
    dsn: sentryDsn,
    environment: config.nodeEnv,
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable Profiling
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error context
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  });

  // RequestHandler creates a separate execution context, so that all transactions/spans/breadcrumbs
  // are isolated across requests
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
  */
};

/**
 * Error tracking middleware (must be before other error handlers)
 */
export const errorTrackingMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error locally
  logger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
  });

  // Uncomment when Sentry packages are installed
  /*
  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      user: {
        id: (req as any).user?.userId,
        email: (req as any).user?.email,
      },
      tags: {
        method: req.method,
        url: req.originalUrl,
      },
      level: 'error',
    });
  }
  */

  next(err);
};

/**
 * Capture custom error with context
 */
export const captureError = (
  error: Error,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void => {
  // Log locally
  logger.error(error.message, error, context?.extra);

  // Uncomment when Sentry packages are installed
  /*
  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      user: context?.userId ? { id: context.userId } : undefined,
      tags: context?.tags,
      extra: context?.extra,
    });
  }
  */
};

/**
 * Capture custom message
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void => {
  // Log locally
  switch (level) {
    case 'info':
      logger.info(message, context?.extra);
      break;
    case 'warning':
      logger.warn(message, context?.extra);
      break;
    case 'error':
      logger.error(message, context?.extra);
      break;
  }

  // Uncomment when Sentry packages are installed
  /*
  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level: level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info',
      user: context?.userId ? { id: context.userId } : undefined,
      tags: context?.tags,
      extra: context?.extra,
    });
  }
  */
};

/**
 * Frontend error tracking helper
 * Returns configuration for frontend Sentry
 */
export const getFrontendErrorTrackingConfig = (): {
  enabled: boolean;
  dsn?: string;
  environment: string;
} => {
  const frontendDsn = process.env.SENTRY_FRONTEND_DSN;

  return {
    enabled: !!frontendDsn,
    dsn: frontendDsn,
    environment: config.nodeEnv,
  };
};
