import { Request, Response, NextFunction } from 'express';

/**
 * Security Logging Middleware
 * 
 * מונע דליפת מידע רגיש בלוגים:
 * - סיסמאות
 * - Tokens
 * - מפתחות API
 * - מידע אישי רגיש
 */

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'newPassword',
  'oldPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'creditCard',
  'cvv',
  'ssn',
  'nationalId',
];

// Fields that should be partially masked
const PARTIAL_MASK_FIELDS = [
  'email',
  'phone',
  'phoneNumber',
  'licenseNumber',
];

/**
 * Recursively sanitize an object by removing/masking sensitive data
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) return '[Object Too Deep]';
  
  if (obj === null || obj === undefined) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  // Handle non-objects (primitives)
  if (typeof obj !== 'object') return obj;
  
  // Handle objects
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Remove sensitive fields completely
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Partially mask certain fields
    if (PARTIAL_MASK_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      if (typeof value === 'string') {
        sanitized[key] = maskString(value);
      } else {
        sanitized[key] = '[MASKED]';
      }
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value, depth + 1);
  }
  
  return sanitized;
}

/**
 * Mask a string (show first 2 and last 2 characters)
 */
function maskString(str: string): string {
  if (str.length <= 4) return '****';
  
  if (str.includes('@')) {
    // Email: show first 2 chars + @ + domain
    const [local, domain] = str.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
  
  // Phone/other: show first 2 and last 2
  return `${str.substring(0, 2)}${'*'.repeat(str.length - 4)}${str.substring(str.length - 2)}`;
}

/**
 * Sanitize request body before logging
 */
export function sanitizeRequestBody(req: Request): any {
  if (!req.body || typeof req.body !== 'object') {
    return req.body;
  }
  
  return sanitizeObject(req.body);
}

/**
 * Sanitize query parameters
 */
export function sanitizeQuery(req: Request): any {
  if (!req.query || typeof req.query !== 'object') {
    return req.query;
  }
  
  return sanitizeObject(req.query);
}

/**
 * Sanitize headers (remove authorization, cookies, etc.)
 */
export function sanitizeHeaders(req: Request): any {
  const sanitized: any = { ...req.headers };
  
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  
  return sanitized;
}

/**
 * Request logging middleware with sensitive data sanitization
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request (sanitized)
  console.log({
    type: 'REQUEST',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    // Don't log full body, query, or headers by default
    // Only log in development mode with sanitization
    ...(process.env.NODE_ENV === 'development' && {
      body: sanitizeRequestBody(req),
      query: sanitizeQuery(req),
    }),
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log({
      type: 'RESPONSE',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
};

/**
 * Safe console.log wrapper
 * Usage: safeLog('User data:', userData)
 */
export function safeLog(...args: any[]) {
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
  
  console.log(...sanitizedArgs);
}

/**
 * Safe error logging
 */
export function safeErrorLog(error: any, context?: any) {
  console.error({
    type: 'ERROR',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    context: context ? sanitizeObject(context) : undefined,
    timestamp: new Date().toISOString(),
  });
}
