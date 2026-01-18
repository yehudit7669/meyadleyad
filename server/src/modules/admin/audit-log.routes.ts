import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import * as ExcelJS from 'exceljs';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin, requireSuperAdmin, requireAdminOrSuper } from '../../middleware/rbac.middleware';
import { AdminAuditService } from './admin-audit.service';
import { sign } from 'jsonwebtoken';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
// Most routes require admin or higher
router.use(requireAdminOrSuper);

// מיפוי קטגוריות לפעולות ספציפיות
const categoryToActionsMap: Record<string, string[]> = {
  'approve': ['approve', 'approve_ad', 'APPROVE_AD'],
  'reject': ['reject', 'reject_ad', 'REJECT_AD'],
  'block': [
    'block', 'block_user', 'unblock', 'BLOCK_USER', 'MEETINGS_BLOCK',
    'ADMIN_MEETINGS_BLOCK', 'ADMIN_MEETINGS_UNBLOCK'
  ],
  'export': ['export', 'EXPORT_AUDIT_LOG', 'EXPORT_USERS', 'EXPORT_ADS', 'export_history'],
  'role_change': ['role_change', 'ROLE_CHANGE', 'UPDATE_USER_ROLE', 'ADMIN_ROLE_CHANGE'],
  'system_change': [
    'system_change', 'SYSTEM_CHANGE', 'VIEW_BRANDING_SETTINGS', 'UPDATE_BRANDING',
    'ADMIN_BULK_REMOVE_USER_ADS', 'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
    'IMPORT_CITIES', 'IMPORT_ADS', 'UPDATE_WATERMARK_SETTINGS', 'UPLOAD_WATERMARK_LOGO'
  ],
};

// מיפוי סוגי ישויות - כולל את כל הערכים האפשריים בבסיס הנתונים
const entityTypeMap: Record<string, string[]> = {
  'user': ['user', 'User', 'USER'],
  'listing': ['listing', 'ad', 'Ad', 'AD', 'Listing'],
  'ad': ['listing', 'ad', 'Ad', 'AD', 'Listing'],
  'appointment': ['appointment', 'Appointment', 'APPOINTMENT'],
  'file': ['file', 'File', 'FILE'],
  'system': ['system', 'System', 'SYSTEM', 'BrandingConfig', 'Category', 'City', 'Street'],
};

// Get audit logs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      action, 
      adminEmail, 
      ip,
      entityType,
      startDate, 
      endDate,
      search 
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    // אם מסננים לפי קטגוריית פעולה, המר לרשימת הפעולות הספציפיות
    if (action) {
      const specificActions = categoryToActionsMap[action as string];
      if (specificActions) {
        where.action = { in: specificActions };
      } else {
        where.action = action;
      }
    }

    if (entityType) {
      const specificEntities = entityTypeMap[entityType as string];
      if (specificEntities) {
        where.entityType = { in: specificEntities };
      } else {
        where.entityType = entityType;
      }
    }

    if (ip) {
      where.ip = { contains: ip as string, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Free text search across multiple fields
    if (search) {
      where.OR = [
        { action: { contains: search as string, mode: 'insensitive' } },
        { targetId: { contains: search as string, mode: 'insensitive' } },
        { entityType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    // Get admin names for logs
    const adminIds = Array.from(new Set(logs.map((log: any) => log.adminId)));
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const adminMap = new Map(admins.map(a => [a.id, a]));

    // Filter by adminEmail if provided
    let logsWithAdminInfo = logs.map((log: any) => ({
      ...log,
      admin: adminMap.get(log.adminId),
    }));

    if (adminEmail) {
      logsWithAdminInfo = logsWithAdminInfo.filter((log: any) => 
        log.admin?.email?.toLowerCase().includes((adminEmail as string).toLowerCase())
      );
    }

    res.json({
      logs: logsWithAdminInfo,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Export audit logs to CSV
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const { action, adminId, startDate, endDate } = req.query;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to prevent huge exports
    });

    // Get admin names
    const adminIds = Array.from(new Set(logs.map((log: any) => log.adminId)));
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true },
    });

    const adminMap = new Map(admins.map((a: any) => [a.id, a]));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    // Headers
    worksheet.columns = [
      { header: 'Date/Time', key: 'createdAt', width: 20 },
      { header: 'Admin Name', key: 'adminName', width: 25 },
      { header: 'Admin Email', key: 'adminEmail', width: 30 },
      { header: 'Action', key: 'action', width: 30 },
      { header: 'Target ID', key: 'targetId', width: 30 },
      { header: 'Details', key: 'meta', width: 50 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data
    logs.forEach((log: any) => {
      const admin = adminMap.get(log.adminId);
      worksheet.addRow({
        createdAt: log.createdAt.toISOString(),
        adminName: admin?.name || 'Unknown',
        adminEmail: admin?.email || 'Unknown',
        action: log.action,
        targetId: log.targetId || '-',
        meta: log.meta ? JSON.stringify(log.meta) : '-',
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');

    await workbook.csv.write(res);
    res.end();

  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Get audit log statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [total, byAction, byAdmin, recent] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.groupBy({
        by: ['action'],
        _count: true,
      }),
      prisma.adminAuditLog.groupBy({
        by: ['adminId'],
        _count: true,
      }),
      prisma.adminAuditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      total,
      byAction: byAction.map(a => ({ action: a.action, count: a._count })),
      byAdmin: byAdmin.map(a => ({ adminId: a.adminId, count: a._count })),
      lastWeek: recent,
    });
  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get single audit log by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.adminAuditLog.findUnique({
      where: { id },
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Get admin info
    const admin = await prisma.user.findUnique({
      where: { id: log.adminId },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({
      ...log,
      admin,
    });
  } catch (error: any) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Export audit logs - SuperAdmin only
router.post('/export', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { format = 'csv', startDate, endDate, action, adminEmail, entityType, search, ip } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'תאריכי התחלה וסיום נדרשים לייצוא' });
    }

    const where: any = {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    // אם מסננים לפי קטגוריית פעולה, המר לרשימת הפעולות הספציפיות
    if (action) {
      const specificActions = categoryToActionsMap[action];
      if (specificActions) {
        where.action = { in: specificActions };
      } else {
        where.action = action;
      }
    }

    if (entityType) {
      const specificEntities = entityTypeMap[entityType];
      if (specificEntities) {
        where.entityType = { in: specificEntities };
      } else {
        where.entityType = entityType;
      }
    }

    if (ip) where.ip = { contains: ip, mode: 'insensitive' };

    // Free text search
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to prevent huge exports
    });

    // Get admin names
    const adminIds = Array.from(new Set(logs.map((log: any) => log.adminId)));
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const adminMap = new Map(admins.map((a: any) => [a.id, a]));

    // Filter by adminEmail if provided (post-fetch filtering)
    let filteredLogs = logs;
    if (adminEmail) {
      filteredLogs = logs.filter((log: any) => {
        const admin = adminMap.get(log.adminId);
        return admin?.email?.toLowerCase().includes(adminEmail.toLowerCase());
      });
    }

    // Create signed token for download
    const token = sign(
      {
        userId: req.user?.id,
        exportType: 'audit_log',
        timestamp: Date.now(),
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' } // 15 minutes TTL
    );

    // Log the export action
    await AdminAuditService.log({
      adminId: req.user?.id!,
      action: 'EXPORT_AUDIT_LOG',
      entityType: 'system',
      meta: {
        format,
        filters: { startDate, endDate, action, adminEmail, entityType, search, ip },
        recordCount: filteredLogs.length,
      },
      ip: req.ip,
    });

    if (format === 'json') {
      const exportData = filteredLogs.map((log: any) => ({
        ...log,
        admin: adminMap.get(log.adminId),
      }));

      res.json({
        token,
        data: exportData,
        count: filteredLogs.length,
      });
    } else {
      // CSV export
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Audit Logs');

      worksheet.columns = [
        { header: 'תאריך ושעה', key: 'createdAt', width: 20 },
        { header: 'שם מנהל', key: 'adminName', width: 25 },
        { header: 'אימייל מנהל', key: 'adminEmail', width: 30 },
        { header: 'תפקיד', key: 'adminRole', width: 15 },
        { header: 'סוג פעולה', key: 'action', width: 30 },
        { header: 'סוג ישות', key: 'entityType', width: 20 },
        { header: 'מזהה ישות', key: 'targetId', width: 30 },
        { header: 'כתובת IP', key: 'ip', width: 20 },
        { header: 'פרטים', key: 'meta', width: 50 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };

      filteredLogs.forEach((log: any) => {
        const admin = adminMap.get(log.adminId);
        worksheet.addRow({
          createdAt: new Date(log.createdAt).toLocaleString('he-IL'),
          adminName: admin?.name || 'לא ידוע',
          adminEmail: admin?.email || 'לא ידוע',
          adminRole: admin?.role || 'לא ידוע',
          action: log.action,
          entityType: log.entityType || '-',
          targetId: log.targetId || '-',
          ip: log.ip || '-',
          meta: log.meta ? JSON.stringify(log.meta) : '-',
        });
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.setHeader('X-Export-Token', token);

      // Add UTF-8 BOM for proper Hebrew encoding in Excel
      res.write('\uFEFF');
      
      await workbook.csv.write(res);
      res.end();
    }
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

export default router;
