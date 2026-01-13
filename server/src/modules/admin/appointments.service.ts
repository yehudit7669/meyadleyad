import { prisma } from '../../lib/prisma';
import { GetAppointmentsQueryDto } from './appointments.validation';

export class AppointmentsAdminService {
  // Get all appointments with filters
  async getAppointments(query: GetAppointmentsQueryDto) {
    const { page, limit, status, startDate, endDate, userId, adId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.OR = [
        { requesterId: userId },
        { ownerId: userId },
      ];
    }

    if (adId) {
      where.adId = adId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          ad: {
            select: {
              id: true,
              title: true,
              AdImage: {
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get appointment statistics
  async getAppointmentStats() {
    const [total, byStatus, recent] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      lastWeek: recent,
    };
  }
}

export const appointmentsAdminService = new AppointmentsAdminService();
