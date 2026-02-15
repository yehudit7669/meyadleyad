/**
 * WhatsApp RBAC Middleware
 * הרשאות ספציפיות למודול WhatsApp
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export interface WhatsAppAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    [key: string]: any;
  };
}

/**
 * מנהל ראשי (SUPER_ADMIN בלבד)
 * יכול: הכל כולל override resend, שינוי מכסות, אישור קבוצות חדשות
 */
export const requireWhatsAppSuperAdmin = (
  req: WhatsAppAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'נדרשת התחברות',
    });
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      status: 'error',
      message: 'פעולה זו מוגבלת למנהל ראשי בלבד',
    });
  }

  next();
};

/**
 * מנהל תוכן מורשה (ADMIN, SUPER_ADMIN, MODERATOR)
 * יכול: אישור מודעות, שליחה ידנית, צפייה בדוחות
 * לא יכול: override resend, שינוי מכסות
 */
export const requireWhatsAppContentManager = (
  req: WhatsAppAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'נדרשת התחברות',
    });
  }

  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return res.status(403).json({
      status: 'error',
      message: 'אין לך הרשאה לגשת למודול WhatsApp',
    });
  }

  next();
};

/**
 * בדיקה האם המשתמש יכול לבצע override resend
 */
export const canOverrideResend = (req: WhatsAppAuthRequest): boolean => {
  return req.user?.role === UserRole.SUPER_ADMIN;
};

/**
 * בדיקה האם המשתמש יכול לשנות מכסות
 */
export const canChangeQuota = (req: WhatsAppAuthRequest): boolean => {
  return req.user?.role === UserRole.SUPER_ADMIN;
};

/**
 * בדיקה האם המשתמש יכול לאשר קבוצות חדשות
 */
export const canApproveGroups = (req: WhatsAppAuthRequest): boolean => {
  return req.user?.role === UserRole.SUPER_ADMIN;
};

/**
 * בדיקה האם המשתמש יכול להציע קבוצות חדשות
 */
export const canSuggestGroups = (req: WhatsAppAuthRequest): boolean => {
  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];
  return req.user ? allowedRoles.includes(req.user.role as UserRole) : false;
};

/**
 * Middleware לבדיקת feature flag
 */
export const checkWhatsAppFeatureFlag = (
  req: WhatsAppAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const enabled = process.env.WHATSAPP_MODULE_ENABLED === 'true';

  if (!enabled) {
    return res.status(503).json({
      status: 'error',
      message: 'מודול WhatsApp אינו זמין כרגע',
    });
  }

  next();
};

/**
 * Rate limiting for WhatsApp actions (simple in-memory)
 * בפרודקשן יש להשתמש ב-Redis
 */
const actionCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (maxActions: number, windowMs: number) => {
  return (req: WhatsAppAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'נדרשת התחברות',
      });
    }

    const userId = req.user.id;
    const now = Date.now();
    const userKey = `${userId}:${req.method}:${req.path}`;

    const record = actionCounts.get(userKey);

    if (!record || now > record.resetAt) {
      // New window
      actionCounts.set(userKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxActions) {
      return res.status(429).json({
        status: 'error',
        message: 'יותר מדי פעולות. נסה שוב מאוחר יותר.',
      });
    }

    record.count++;
    next();
  };
};

/**
 * Logging middleware for WhatsApp actions
 */
export const logWhatsAppAction = (
  req: WhatsAppAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id || 'anonymous';
  const method = req.method;
  const path = req.path;
  const timestamp = new Date().toISOString();

  console.log(`[WhatsApp] ${timestamp} - User ${userId} - ${method} ${path}`);

  next();
};
