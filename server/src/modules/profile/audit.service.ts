import { prisma } from '../../config/database';

export class AuditService {
  static async log(userId: string, action: string, meta?: any) {
    try {
      await prisma.userAudit.create({
        data: {
          userId,
          action,
          meta: meta || {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  static async getAuditLog(userId: string, limit = 50) {
    return await prisma.userAudit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
