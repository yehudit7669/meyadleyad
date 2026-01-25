import { Router, Request, Response } from 'express';
import { emailPermissionsService } from './email-permissions.service';
import { authenticate } from '../../middlewares/auth';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';
import { AdminAuditService } from './admin-audit.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's permissions (any authenticated user)
router.get('/my-permissions', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Return empty array if table doesn't exist yet
    try {
      const permissions = await emailPermissionsService.getPermissionsByEmail(user.email);
      res.json(permissions);
    } catch (dbError) {
      // If table doesn't exist, return empty array
      console.log('Email permissions table not yet created, returning empty array');
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// All other routes require Super Admin role
router.use(requireSuperAdmin);

// Get all email permissions
router.get('/', async (req: Request, res: Response) => {
  try {
    const permissions = await emailPermissionsService.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching email permissions:', error);
    res.status(500).json({ error: 'Failed to fetch email permissions' });
  }
});

// Get permissions by email
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const permissions = await emailPermissionsService.getPermissionsByEmail(email);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions for email:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Create new permission
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📨 POST /api/admin/email-permissions - Request body:', req.body);
    console.log('👤 User:', (req as any).user);
    
    const { email, permissionType, scope, expiry, adminNote } = req.body;
    
    // Validation
    if (!email || !permissionType || !adminNote) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields: email, permissionType, adminNote' 
      });
    }

    const validPermissionTypes = [
      'export_users',
      'export_ads', 
      'export_stats',
      'export_mailing_list',
      'download_audit_log'
    ];

    if (!validPermissionTypes.includes(permissionType)) {
      console.log('❌ Invalid permission type:', permissionType);
      return res.status(400).json({ error: 'Invalid permission type' });
    }

    if (scope && !['one-time', 'permanent'].includes(scope)) {
      console.log('❌ Invalid scope:', scope);
      return res.status(400).json({ error: 'Invalid scope. Must be one-time or permanent' });
    }

    console.log('✅ Validation passed, creating permission...');
    const permission = await emailPermissionsService.createPermission({
      email,
      permissionType,
      scope: scope || 'one-time',
      expiry,
      adminNote,
      createdBy: (req as any).user?.email || (req as any).user?.id?.toString() || 'unknown'
    });
    
    console.log('✅ Permission created:', permission);

    // Log to audit
    await AdminAuditService.log({
      adminId: (req as any).user?.id?.toString() || 'unknown',
      action: 'CREATE_EMAIL_PERMISSION',
      targetId: permission.id?.toString(),
      entityType: 'email_permissions',
      meta: {
        email,
        permissionType,
        scope: scope || 'one-time',
        adminNote
      },
      ip: req.ip || req.socket.remoteAddress
    });

    console.log('✅ Audit log created');
    res.status(201).json(permission);
  } catch (error) {
    console.error('❌ Error creating email permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
});

// Update permission
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const permission = await emailPermissionsService.updatePermission(parseInt(id), updates);

    // Log to audit
    await AdminAuditService.log({
      adminId: (req as any).user?.id?.toString() || 'unknown',
      action: 'UPDATE_EMAIL_PERMISSION',
      targetId: id,
      entityType: 'email_permissions',
      meta: updates,
      ip: req.ip || req.socket.remoteAddress
    });

    res.json(permission);
  } catch (error) {
    console.error('Error updating email permission:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

// Delete (deactivate) permission
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await emailPermissionsService.deletePermission(parseInt(id));

    // Log to audit
    await AdminAuditService.log({
      adminId: (req as any).user?.id?.toString() || 'unknown',
      action: 'DELETE_EMAIL_PERMISSION',
      targetId: id,
      entityType: 'email_permissions',
      meta: {},
      ip: req.ip || req.socket.remoteAddress
    });

    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting email permission:', error);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
});

// Check if user has specific permission
router.get('/check/:email/:permissionType', async (req: Request, res: Response) => {
  try {
    const { email, permissionType } = req.params;
    const hasPermission = await emailPermissionsService.hasPermission(email, permissionType);
    res.json({ hasPermission });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

export default router;
