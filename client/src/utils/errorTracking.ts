/**
 * Frontend Error Tracking
 * Sentry-ready error tracking for React applications
 * 
 * To enable Sentry:
 * 1. Install: npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in .env
 * 3. Uncomment Sentry initialization code
 */

// Uncomment when Sentry package is installed
// import * as Sentry from '@sentry/react';
// import { BrowserTracing } from '@sentry/tracing';

/**
 * Error tracking configuration
 */
interface ErrorTrackingConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
}

/**
 * Initialize error tracking
 */
export const initErrorTracking = (_config?: ErrorTrackingConfig): void => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';

  if (!sentryDsn) {
    console.info('[Error Tracking] Sentry DSN not configured - error tracking disabled');
    return;
  }

  console.info('[Error Tracking] Initializing Sentry...', { environment });

  // Uncomment when Sentry package is installed
  /*
  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            delete breadcrumb.data.password;
            delete breadcrumb.data.token;
            delete breadcrumb.data.apiKey;
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });
  */
};

/**
 * Capture exception
 */
export const captureException = (
  error: Error,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void => {
  // Log to console
  console.error('[Error Tracking]', error, context);

  // Uncomment when Sentry package is installed
  /*
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      user: context?.userId ? { id: context.userId } : undefined,
      tags: context?.tags,
      extra: context?.extra,
    });
  }
  */
};

/**
 * Capture message
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
  // Log to console
  console[level === 'warning' ? 'warn' : level]('[Error Tracking]', message, context);

  // Uncomment when Sentry package is installed
  /*
  if (import.meta.env.VITE_SENTRY_DSN) {
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
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  name?: string;
}): void => {
  console.info('[Error Tracking] Setting user context:', user.id);

  // Uncomment when Sentry package is installed
  /*
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
  */
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = (): void => {
  console.info('[Error Tracking] Clearing user context');

  // Uncomment when Sentry package is installed
  /*
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
  */
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, any>
): void => {
  console.debug('[Breadcrumb]', category, message, data);

  // Uncomment when Sentry package is installed
  /*
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }
  */
};

/**
 * Error Boundary component wrapper
 * Uncomment when Sentry package is installed
 */
/*
export const ErrorBoundary = Sentry.ErrorBoundary;
*/
