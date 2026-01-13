import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import * as ExcelJS from 'exceljs';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get audit logs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', action, adminId, startDate, endDate } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

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
      select: { id: true, name: true, email: true },
    });

    const adminMap = new Map(admins.map(a => [a.id, a]));

    const logsWithAdminInfo = logs.map((log: any) => ({
      ...log,
      admin: adminMap.get(log.adminId),
    }));

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

export default router;
