import { prisma } from '../../config/database';

export interface AuditLogEntry {
  adminId: string;
  action: string;
  targetId?: string;
  entityType?: string;
  meta?: Record<string, any>;
  ip?: string;
}

export class AdminAuditService {
  /**
   * Create an audit log entry
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          targetId: entry.targetId,
          entityType: entry.entityType,
          meta: entry.meta || {},
          ip: entry.ip,
        },
      });
    } catch (error) {
      console.error('Failed to create admin audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Get audit logs for a specific admin
   */
  static async getAdminLogs(adminId: string, limit = 100) {
    return await prisma.adminAuditLog.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific target/entity
   */
  static async getTargetLogs(targetId: string, limit = 10) {
    return await prisma.adminAuditLog.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs by action type
   */
  static async getActionLogs(action: string, limit = 100) {
    return await prisma.adminAuditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all audit logs with pagination and filters
   */
  static async getAllLogs(params: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.adminId) {
      where.adminId = params.adminId;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
