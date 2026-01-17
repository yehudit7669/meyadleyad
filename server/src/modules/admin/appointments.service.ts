import { prisma } from '../../lib/prisma';
import { GetAppointmentsQueryDto } from './appointments.validation';
import { AdminAuditService } from './admin-audit.service';

export class AppointmentsAdminService {
  // Get all appointments with filters and search
  async getAppointments(query: GetAppointmentsQueryDto, userRole: string) {
    const { 
      page, 
      limit, 
      status, 
      startDate, 
      endDate, 
      userId, 
      adId,
      q,
      searchBy,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = query;
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

    // Search functionality
    if (q && searchBy) {
      switch (searchBy) {
        case 'userName':
          where.OR = [
            { requester: { name: { contains: q, mode: 'insensitive' } } },
            { owner: { name: { contains: q, mode: 'insensitive' } } },
          ];
          break;
        case 'phone':
          where.OR = [
            { requester: { phone: { contains: q } } },
            { owner: { phone: { contains: q } } },
          ];
          break;
        case 'propertyAddress':
          where.ad = {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
              { Street: { name: { contains: q, mode: 'insensitive' } } },
              { City: { name: { contains: q, mode: 'insensitive' } } },
            ]
          };
          break;
      }
    }

    // Determine what fields to include based on role (RBAC)
    const isModerator = userRole === 'MODERATOR';
    
    const userSelect = isModerator 
      ? { id: true, name: true } // Moderator sees less
      : { id: true, name: true, email: true, phone: true }; // Admin/Super Admin see all

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
              address: true,
              Street: {
                select: {
                  name: true,
                },
              },
              City: {
                select: {
                  name: true,
                },
              },
              AdImage: {
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
          requester: {
            select: userSelect,
          },
          owner: {
            select: userSelect,
          },
        },
        orderBy: { [sortBy]: sortDir },
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

  // Get single appointment by ID with full details
  async getAppointmentById(id: string, userRole: string) {
    const isModerator = userRole === 'MODERATOR';
    
    const userSelect = isModerator 
      ? { id: true, name: true }
      : { id: true, name: true, email: true, phone: true };

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            address: true,
            Street: {
              select: {
                name: true,
              },
            },
            City: {
              select: {
                name: true,
              },
            },
            customFields: true,
            price: true,
            AdImage: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        requester: {
          select: userSelect,
        },
        owner: {
          select: userSelect,
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  // Update appointment status
  async updateAppointmentStatus(
    id: string, 
    status: string, 
    reason: string | undefined,
    adminId: string,
    adminRole: string,
    ip?: string
  ) {
    // RBAC: only Admin and Super Admin can update status
    if (adminRole === 'MODERATOR') {
      throw new Error('Insufficient permissions');
    }

    // Validate that reason is provided for REJECTED and CANCELED
    if ((status === 'REJECTED' || status === 'CANCELED') && !reason) {
      throw new Error('Reason is required for REJECTED or CANCELED status');
    }

    if (reason && reason.length > 250) {
      throw new Error('Reason must be 250 characters or less');
    }

    // Get current appointment
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!currentAppointment) {
      throw new Error('Appointment not found');
    }

    // Update appointment and create history in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update appointment
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: {
          status: status as any,
          statusReason: reason || null,
          updatedAt: new Date(),
        },
        include: {
          ad: { select: { id: true, title: true } },
          requester: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      });

      // Create history record
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          fromStatus: currentAppointment.status,
          toStatus: status as any,
          reason: reason || null,
          changedById: adminId,
        },
      });

      return updatedAppointment;
    });

    // Create audit log
    await AdminAuditService.log({
      adminId,
      action: 'UPDATE_APPOINTMENT_STATUS',
      targetId: id,
      entityType: 'APPOINTMENT',
      meta: {
        fromStatus: currentAppointment.status,
        toStatus: status,
        reason,
        appointmentDate: currentAppointment.date,
        adId: currentAppointment.adId,
      },
      ip,
    });

    return updated;
  }

  // Cancel appointment
  async cancelAppointment(
    id: string,
    reason: string,
    adminId: string,
    adminRole: string,
    ip?: string
  ) {
    return this.updateAppointmentStatus(id, 'CANCELED', reason, adminId, adminRole, ip);
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
