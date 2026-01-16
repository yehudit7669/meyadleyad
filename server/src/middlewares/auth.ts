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
