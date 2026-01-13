/**
 * Performance Monitoring Middleware
 * Tracks request/response times and identifies slow endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Performance thresholds in milliseconds
 */
const PERFORMANCE_THRESHOLDS = {
  FAST: 100, // < 100ms - fast
  NORMAL: 500, // 100-500ms - normal
  SLOW: 1000, // 500-1000ms - slow
  CRITICAL: 3000, // > 3000ms - critical
};

/**
 * Track slow endpoints for analysis
 */
const slowEndpoints = new Map<string, { count: number; totalDuration: number }>();

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, originalUrl, path } = req;

  // Skip health checks and static files
  if (path === '/health' || path.startsWith('/uploads/')) {
    return next();
  }

  // Log request start
  logger.debug(`→ ${method} ${originalUrl}`, {
    type: 'REQUEST_START',
    method,
    url: originalUrl,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    // Log response with duration
    logger.response(method, originalUrl, statusCode, duration);

    // Performance analysis
    analyzePerformance(method, path, duration, statusCode);

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Analyze request performance and log warnings for slow endpoints
 */
const analyzePerformance = (
  method: string,
  path: string,
  duration: number,
  statusCode: number
): void => {
  const endpoint = `${method} ${path}`;

  // Track slow endpoints
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
    const stats = slowEndpoints.get(endpoint) || { count: 0, totalDuration: 0 };
    stats.count++;
    stats.totalDuration += duration;
    slowEndpoints.set(endpoint, stats);

    // Log slow request
    if (duration > PERFORMANCE_THRESHOLDS.CRITICAL) {
      logger.error('Critical slow endpoint', {
        type: 'PERFORMANCE_CRITICAL',
        endpoint,
        duration,
        statusCode,
        threshold: PERFORMANCE_THRESHOLDS.CRITICAL,
      });
    } else {
      logger.warn('Slow endpoint detected', {
        type: 'PERFORMANCE_SLOW',
        endpoint,
        duration,
        statusCode,
        threshold: PERFORMANCE_THRESHOLDS.SLOW,
      });
    }
  }

  // Log performance category
  if (duration < PERFORMANCE_THRESHOLDS.FAST) {
    logger.debug(`✓ Fast response: ${endpoint} (${duration}ms)`, {
      type: 'PERFORMANCE_FAST',
      endpoint,
      duration,
    });
  } else if (duration < PERFORMANCE_THRESHOLDS.NORMAL) {
    logger.debug(`→ Normal response: ${endpoint} (${duration}ms)`, {
      type: 'PERFORMANCE_NORMAL',
      endpoint,
      duration,
    });
  }
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = (): {
  slowEndpoints: Array<{
    endpoint: string;
    count: number;
    avgDuration: number;
    totalDuration: number;
  }>;
} => {
  const stats = Array.from(slowEndpoints.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgDuration: Math.round(data.totalDuration / data.count),
      totalDuration: data.totalDuration,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration);

  return { slowEndpoints: stats };
};

/**
 * Reset performance statistics
 */
export const resetPerformanceStats = (): void => {
  slowEndpoints.clear();
  logger.info('Performance statistics reset');
};

/**
 * Middleware to expose performance stats endpoint (admin only)
 */
export const performanceStatsEndpoint = (_req: Request, res: Response): void => {
  const stats = getPerformanceStats();
  
  res.json({
    status: 'success',
    data: {
      thresholds: PERFORMANCE_THRESHOLDS,
      ...stats,
    },
  });
};
