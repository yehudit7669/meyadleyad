import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    [key: string]: any;
  };
}

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'נדרשת התחברות',
    });
  }

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'];
  
  if (!adminRoles.includes(req.user.role as string)) {
    console.log('❌ requireAdmin failed - user role:', req.user.role, 'allowed:', adminRoles);
    return res.status(403).json({
      status: 'error',
      message: 'Insufficient permissions',
    });
  }

  next();
};

/**
 * Middleware to check if user has specific admin role(s)
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const roleStrings = roles.map(r => r.toString());
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'נדרשת התחברות',
      });
    }

    if (!roleStrings.includes(req.user.role as string)) {
      console.log('❌ requireRole failed - user role:', req.user.role, 'allowed:', roleStrings);
      return res.status(403).json({
        status: 'error',
        message: 'אין לך הרשאה לבצע פעולה זו',
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is Super Admin
 */
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

/**
 * Middleware to check if user is Admin or Super Admin
 */
export const requireAdminOrSuper = requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

/**
 * Check if user has permission for specific action
 */
export const checkPermission = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'נדרשת התחברות',
      });
    }

    const role = req.user.role;
    const permissions = getPermissionsForRole(role);

    if (!permissions.includes(action)) {
      return res.status(403).json({
        status: 'error',
        message: 'אין לך הרשאה לבצע פעולה זו',
      });
    }

    next();
  };
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        'users:read',
        'users:write',
        'users:delete',
        'users:export',
        'users:search_email',
        'users:block_meetings',
        'users:bulk_remove_ads',
        'ads:read',
        'ads:write',
        'ads:delete',
        'ads:export',
        'audit:read',
        'audit:export',
      ];
    
    case UserRole.ADMIN:
      return [
        'users:read',
        'users:write',
        'users:search_email',
        'users:block_meetings',
        'ads:read',
        'ads:write',
        'ads:export',
        'audit:read',
      ];
    
    case UserRole.MODERATOR:
      return [
        'users:read',
        'ads:read',
        'audit:read',
      ];
    
    default:
      return [];
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}
