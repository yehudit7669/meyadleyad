import { Request, Response, NextFunction } from 'express';
import { emailPermissionsService } from '../modules/admin/email-permissions.service';

/**
 * Middleware to check if user has permission (either by role or by email-based exception)
 * @param permissionType - The type of permission to check (e.g., 'export_users', 'export_ads')
 * @param requiredRole - The minimum role required (optional, if not specified only email permissions are checked)
 */
export const checkPermission = (permissionType: string, requiredRole?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'נדרש להתחבר למערכת' });
      }

      // Super Admin always has access
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check role-based permission if requiredRole is specified
      if (requiredRole) {
        if (requiredRole === 'ADMIN' && user.role === 'ADMIN') {
          return next();
        }
        if (requiredRole === 'MODERATOR' && (user.role === 'MODERATOR' || user.role === 'ADMIN')) {
          return next();
        }
      }

      // Check email-based exceptional permission
      const hasEmailPermission = await emailPermissionsService.hasPermission(
        user.email,
        permissionType
      );

      if (hasEmailPermission) {
        console.log(`✅ User ${user.email} has email-based permission for ${permissionType}`);
        
        // Mark permission as used if it's one-time
        const permissions = await emailPermissionsService.getPermissionsByEmail(user.email);
        const relevantPermission = permissions.find(
          p => p.permissionType === permissionType && p.scope === 'one-time' && !p.usedAt
        );
        
        if (relevantPermission && relevantPermission.id) {
          await emailPermissionsService.markAsUsed(relevantPermission.id);
        }
        
        return next();
      }

      // No permission found
      return res.status(403).json({ 
        error: 'אין לך הרשאה לבצע פעולה זו',
        required: permissionType 
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      return res.status(500).json({ error: 'שגיאה בבדיקת הרשאות' });
    }
  };
};
