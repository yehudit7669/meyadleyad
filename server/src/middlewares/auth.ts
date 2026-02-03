import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isAdmin?: boolean;
    isBroker?: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = (req as any).headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('AUTH - No token provided');
      throw new UnauthorizedError('נדרש להתחבר למערכת');
    }

    console.log('AUTH - Token received:', token.substring(0, 50) + '...');

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      role: string;
    };

    console.log('AUTH - Token decoded:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      console.log('AUTH - User not found', { userId: decoded.userId });
      throw new UnauthorizedError('משתמש לא נמצא במערכת');
    }

    console.log('AUTH - User found:', { id: user.id, email: user.email, role: user.role, status: user.status });

    if (user.status !== 'ACTIVE') {
      console.log('AUTH - User not active', { userId: decoded.userId, status: user.status });
      throw new UnauthorizedError('החשבון אינו פעיל');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
      isBroker: user.role === 'BROKER',
    };
    
    console.log('AUTH - User set on request:', req.user);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('AUTH - Invalid token');
      next(new UnauthorizedError('אסימון התחברות לא תקין'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      console.log('❌ authorize failed - user role:', req.user.role, 'allowed:', roles);
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Advanced authorization that also checks email permissions
 * @param roles - Required roles (ADMIN, SUPER_ADMIN, etc.)
 * @param permission - Optional email permission that can grant access
 */
export const authorizeWithPermission = (roles: string[], permission?: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user's role is in the allowed roles
    if (roles.includes(req.user.role)) {
      return next();
    }

    // If permission is specified, check email permissions
    if (permission && req.user.email) {
      try {
        const emailPermission = await prisma.$queryRaw<any[]>`
          SELECT id, permission_type
          FROM email_permissions
          WHERE email = ${req.user.email}
            AND permission_type = ${permission}
            AND is_active = TRUE
            AND (expiry IS NULL OR expiry > NOW())
          LIMIT 1
        `;

        if (emailPermission && emailPermission.length > 0) {
          console.log('✅ Access granted via email permission:', permission, 'for user:', req.user.email);
          return next();
        }
      } catch (error) {
        console.error('Error checking email permissions:', error);
      }
    }

    console.log('❌ authorize failed - user role:', req.user.role, 'allowed:', roles, 'permission:', permission);
    return next(new UnauthorizedError('Insufficient permissions'));
  };
};

/**
 * Optional authentication - sets user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = (req as any).headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // No token, continue as guest
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
        isBroker: user.role === 'BROKER',
      };
    }

    next();
  } catch (error) {
    // Invalid token, continue as guest
    next();
  }
};

// Alias for consistency
export const auth = authenticate;
