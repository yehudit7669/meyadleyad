import { prisma } from '../../lib/prisma';
import { UpdateMeetingAccessDto, GetUsersQueryDto } from './user-management.validation';
import * as ExcelJS from 'exceljs';

export class UserManagementService {
  // Get all users with pagination and filters
  async getUsers(query: GetUsersQueryDto) {
    const { page, limit, role, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          companyName: true,
          licenseNumber: true,
          isVerified: true,
          isEmailVerified: true,
          createdAt: true,
          _count: {
            select: {
              Ad: true,
            },
          },
          UserAppointmentPolicy: {
            select: {
              isBlocked: true,
              blockReason: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get user details with ads
  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Ad: {
          select: {
            id: true,
            title: true,
            status: true,
            views: true,
            createdAt: true,
            publishedAt: true,
            Category: {
              select: {
                nameHe: true,
              },
            },
            AdImage: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        UserAppointmentPolicy: true,
        _count: {
          select: {
            Ad: true,
            AppointmentRequester: true,
            AppointmentOwner: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update meeting access control
  async updateMeetingAccess(userId: string, adminId: string, data: UpdateMeetingAccessDto) {
    const { isBlocked, reason } = data;

    // Upsert meeting access control
    const meetingAccess = await prisma.userAppointmentPolicy.upsert({
      where: { userId },
      update: {
        isBlocked,
        blockReason: reason || null,
        updatedById: adminId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        isBlocked,
        blockReason: reason || null,
        updatedById: adminId,
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: isBlocked ? 'BLOCK_MEETING_ACCESS' : 'UNBLOCK_MEETING_ACCESS',
        targetId: userId,
        meta: {
          reason,
          previousState: !isBlocked,
        },
      },
    });

    return meetingAccess;
  }

  // Get meeting access status
  async getMeetingAccess(userId: string) {
    const policy = await prisma.userAppointmentPolicy.findUnique({
      where: { userId },
    });

    return policy || {
      userId,
      isBlocked: false,
      blockReason: null,
      updatedAt: new Date(),
    };
  }

  // Export users to Excel
  async exportUsersToExcel(filters?: { role?: string; search?: string }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        companyName: true,
        licenseNumber: true,
        isVerified: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            Ad: true,
          },
        },
        UserAppointmentPolicy: {
          select: {
            isBlocked: true,
            blockReason: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Company', key: 'companyName', width: 25 },
      { header: 'License', key: 'licenseNumber', width: 15 },
      { header: 'Verified', key: 'isVerified', width: 12 },
      { header: 'Email Verified', key: 'isEmailVerified', width: 15 },
      { header: 'Total Ads', key: 'totalAds', width: 12 },
      { header: 'Meeting Blocked', key: 'meetingBlocked', width: 15 },
      { header: 'Block Reason', key: 'blockReason', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data
    users.forEach((user: any) => {
      worksheet.addRow({
        id: user.id,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        role: user.role,
        companyName: user.companyName || '',
        licenseNumber: user.licenseNumber || '',
        isVerified: user.isVerified ? 'Yes' : 'No',
        isEmailVerified: user.isEmailVerified ? 'Yes' : 'No',
        totalAds: user._count.Ad,
        meetingBlocked: user.UserAppointmentPolicy?.isBlocked ? 'Yes' : 'No',
        blockReason: user.UserAppointmentPolicy?.blockReason || '',
        createdAt: user.createdAt.toISOString(),
      });
    });

    return workbook;
  }
}

export const userManagementService = new UserManagementService();
