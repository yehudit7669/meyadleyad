import { prisma } from '../../../config/database';
import { UserRole, UserStatus, AdStatus } from '@prisma/client';
import { GetUsersQuery, UpdateUserDto, MeetingsBlockDto, BulkRemoveAdsDto, CreateUserDto } from './users-admin.validation';
import { AdminAuditService } from '../admin-audit.service';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';

export class UsersAdminService {
  /**
   * Create new user (Super Admin only)
   */
  async createUser(
    data: CreateUserDto,
    adminId: string,
    ip?: string
  ) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('משתמש עם כתובת אימייל זו כבר קיים במערכת');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || null,
        phone: data.phone || null,
        role: data.role,
        status: UserStatus.ACTIVE,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'ADMIN_CREATE_USER',
      targetId: user.id,
      entityType: 'USER',
      meta: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ip,
    });

    return user;
  }

  /**
   * Get users list with search, filters, and pagination
   */
  async getUsers(query: GetUsersQuery, requestorRole: UserRole) {
    const { page, limit, q, searchBy, roleType, status, dateFrom, dateTo, sortBy, sortDir } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search
    if (q && searchBy) {
      if (searchBy === 'email') {
        // Only Admin and Super Admin can search by email
        if (requestorRole !== UserRole.ADMIN && requestorRole !== UserRole.SUPER_ADMIN) {
          throw new Error('אין הרשאה לחפש לפי אימייל');
        }
        where.email = { contains: q, mode: 'insensitive' };
      } else if (searchBy === 'name') {
        where.name = { contains: q, mode: 'insensitive' };
      } else if (searchBy === 'id') {
        where.id = q;
      }
    } else if (q) {
      // Default search by name only
      where.name = { contains: q, mode: 'insensitive' };
    }

    // Filters
    if (roleType) {
      where.role = roleType;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Build order by
    const orderBy: any = {};
    if (sortBy === 'adsCount') {
      // Special case: sort by ads count requires join
      orderBy.Ad = { _count: sortDir };
    } else {
      orderBy[sortBy] = sortDir;
    }

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          meetingsBlocked: true,
          weeklyDigestOptIn: true,
          _count: {
            select: {
              Ad: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Filter sensitive data for Moderators
    const isModerator = requestorRole === UserRole.MODERATOR;

    return {
      users: users.map(user => ({
        id: isModerator ? '***' : user.id,
        name: user.name || 'משתמש ללא שם',
        email: isModerator ? '***@***.***' : user.email,
        role: user.role,
        roleType: this.mapRoleToDisplay(user.role),
        status: user.status,
        createdAt: user.createdAt,
        adsCount: user._count.Ad,
        meetingsBlocked: user.meetingsBlocked,
        emailDigestStatus: user.weeklyDigestOptIn,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string, requestorRole?: UserRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Ad: {
          select: {
            id: true,
            title: true,
            address: true,
            createdAt: true,
            status: true,
            views: true,
            adNumber: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        UserPreference: true,
        _count: {
          select: {
            Ad: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    // Get recent audit logs for this user
    const auditLogs = await AdminAuditService.getTargetLogs(userId, 10);

    // Filter sensitive data for Moderators
    const isModerator = requestorRole === UserRole.MODERATOR;

    return {
      id: isModerator ? '***' : user.id,
      name: user.name || 'משתמש ללא שם',
      email: isModerator ? '***@***.***' : user.email,
      phone: isModerator ? undefined : user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      meetingsBlocked: user.meetingsBlocked,
      meetingsBlockReason: user.meetingsBlockReason,
      meetingsBlockedAt: user.meetingsBlockedAt,
      weeklyDigestOptIn: user.weeklyDigestOptIn,
      notifyNewMatches: user.UserPreference?.notifyNewMatches,
      adsCount: user._count.Ad,
      ads: user.Ad.map(ad => ({
        id: isModerator ? '***' : ad.id,
        address: ad.address || ad.title,
        createdAt: ad.createdAt,
        status: ad.status,
        viewsCount: ad.views,
        serialNumber: ad.adNumber,
        previewLink: isModerator ? '#' : `/ad/${ad.id}`,
      })),
      auditHistory: isModerator ? [] : auditLogs,
    };
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    data: UpdateUserDto,
    adminId: string,
    adminRole: UserRole,
    ip?: string
  ) {
    // Check permissions
    if (adminRole === UserRole.MODERATOR) {
      throw new Error('למנהל צופה אין הרשאה לערוך משתמשים');
    }

    // Get current user data for diff
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new Error('משתמש לא נמצא');
    }

    // Only Super Admin can change roleType
    if (data.roleType && adminRole !== UserRole.SUPER_ADMIN) {
      throw new Error('רק מנהל על יכול לשנות סוג משתמש');
    }

    // Build update data
    const updateData: any = {};
    const changes: any = {};

    if (data.name !== undefined && data.name !== currentUser.name) {
      updateData.name = data.name;
      changes.name = { from: currentUser.name, to: data.name };
    }

    if (data.phone !== undefined && data.phone !== currentUser.phone) {
      updateData.phone = data.phone;
      changes.phone = { from: currentUser.phone, to: data.phone };
    }

    if (data.roleType !== undefined && data.roleType !== currentUser.role) {
      updateData.role = data.roleType;
      changes.role = { from: currentUser.role, to: data.roleType };
    }

    if (data.status !== undefined && data.status !== currentUser.status) {
      updateData.status = data.status;
      changes.status = { from: currentUser.status, to: data.status };
    }

    if (data.weeklyDigestOptIn !== undefined && data.weeklyDigestOptIn !== currentUser.weeklyDigestOptIn) {
      updateData.weeklyDigestOptIn = data.weeklyDigestOptIn;
      changes.weeklyDigestOptIn = { from: currentUser.weeklyDigestOptIn, to: data.weeklyDigestOptIn };
    }

    // Update user preferences if needed
    if (data.notifyNewMatches !== undefined) {
      await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          notifyNewMatches: data.notifyNewMatches,
        },
        update: {
          notifyNewMatches: data.notifyNewMatches,
        },
      });
      changes.notifyNewMatches = { to: data.notifyNewMatches };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'ADMIN_UPDATE_USER',
      targetId: userId,
      entityType: 'USER',
      meta: { changes },
      ip,
    });

    return updatedUser;
  }

  /**
   * Block/unblock meetings for user
   */
  async setMeetingsBlock(
    userId: string,
    data: MeetingsBlockDto,
    adminId: string,
    adminRole: UserRole,
    ip?: string
  ) {
    // Check permissions
    if (adminRole !== UserRole.ADMIN && adminRole !== UserRole.SUPER_ADMIN) {
      throw new Error('אין הרשאה לבצע פעולה זו');
    }

    const updateData: any = {
      meetingsBlocked: data.blocked,
    };

    if (data.blocked) {
      updateData.meetingsBlockReason = data.reason || null;
      updateData.meetingsBlockedAt = new Date();
      updateData.meetingsBlockedByAdminId = adminId;
    } else {
      updateData.meetingsBlockReason = null;
      updateData.meetingsBlockedAt = null;
      updateData.meetingsBlockedByAdminId = null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: data.blocked ? 'ADMIN_MEETINGS_BLOCK' : 'ADMIN_MEETINGS_UNBLOCK',
      targetId: userId,
      entityType: 'USER',
      meta: {
        blocked: data.blocked,
        reason: data.reason,
      },
      ip,
    });

    return user;
  }

  /**
   * Hard delete user (Super Admin only)
   */
  async deleteUser(userId: string, adminId: string, ip?: string) {
    // Get user data before deletion for audit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            Ad: true,
            Favorite: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'ADMIN_HARD_DELETE_USER',
      targetId: userId,
      entityType: 'USER',
      meta: {
        email: user.email,
        name: user.name,
        adsCount: user._count.Ad,
        favoritesCount: user._count.Favorite,
      },
      ip,
    });

    return { success: true };
  }

  /**
   * Bulk remove all ads of a user (Super Admin only)
   */
  async bulkRemoveUserAds(
    userId: string,
    data: BulkRemoveAdsDto,
    adminId: string,
    ip?: string
  ) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    // Update all user ads to REMOVED status
    const result = await prisma.ad.updateMany({
      where: {
        userId,
        status: { not: AdStatus.REMOVED },
      },
      data: {
        status: AdStatus.REMOVED,
        removedAt: new Date(),
      },
    });

    // Audit log
    await AdminAuditService.log({
      adminId,
      action: 'ADMIN_BULK_REMOVE_USER_ADS',
      targetId: userId,
      entityType: 'USER',
      meta: {
        userName: user.name,
        userEmail: user.email,
        removedCount: result.count,
        reason: data.reason,
      },
      ip,
    });

    return { removedCount: result.count };
  }

  /**
   * Export users to Excel
   */
  async exportUsers(query: GetUsersQuery, requestorRole: UserRole): Promise<Buffer> {
    // Build where clause using same logic as getUsers
    const where: any = {};

    // Search logic
    if (query.q && query.searchBy) {
      if (query.searchBy === 'name') {
        where.name = { contains: query.q, mode: 'insensitive' };
      } else if (query.searchBy === 'email') {
        if (requestorRole !== UserRole.MODERATOR) {
          where.email = { contains: query.q, mode: 'insensitive' };
        }
      } else if (query.searchBy === 'id') {
        where.id = query.q;
      }
    }

    // Filters
    if (query.roleType) {
      where.role = query.roleType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const dateTo = new Date(query.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        where.createdAt.lte = dateTo;
      }
    }

    // Fetch all matching users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            Ad: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('משתמשים');

    // Define columns
    worksheet.columns = [
      { header: 'שם מלא', key: 'name', width: 25 },
      { header: 'אימייל', key: 'email', width: 30 },
      { header: 'טלפון', key: 'phone', width: 15 },
      { header: 'סוג משתמש', key: 'roleType', width: 20 },
      { header: 'סטטוס', key: 'status', width: 15 },
      { header: 'תאריך הרשמה', key: 'createdAt', width: 20 },
      { header: 'כמות מודעות', key: 'adsCount', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    worksheet.getRow(1).alignment = { horizontal: 'right', vertical: 'middle' };

    // Add data rows
    users.forEach(user => {
      worksheet.addRow({
        name: user.name || 'לא צוין',
        email: requestorRole === UserRole.MODERATOR ? '***' : user.email,
        phone: user.phone || 'לא צוין',
        roleType: this.mapRoleToDisplay(user.role),
        status: this.mapStatusToDisplay(user.status),
        createdAt: new Date(user.createdAt).toLocaleDateString('he-IL'),
        adsCount: user._count.Ad,
      });
    });

    // Set RTL direction for all cells
    worksheet.views = [{ rightToLeft: true }];

    // Generate buffer using writeBuffer method
    // @ts-ignore - writeBuffer exists but types might be outdated
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Map status to display string
   */
  private mapStatusToDisplay(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'פעיל';
      case UserStatus.PARTIAL_BLOCK:
        return 'חסימה חלקית';
      case UserStatus.BLOCKED:
        return 'חסום';
      default:
        return 'לא ידוע';
    }
  }

  /**
   * Map role to display string
   */
  private mapRoleToDisplay(role: UserRole): string {
    switch (role) {
      case UserRole.USER:
        return 'משתמש פרטי';
      case UserRole.BROKER:
        return 'מתווך';
      case UserRole.SERVICE_PROVIDER:
        return 'נותן שירות';
      case UserRole.ADMIN:
        return 'מנהל';
      case UserRole.SUPER_ADMIN:
        return 'מנהל על';
      case UserRole.MODERATOR:
        return 'מנהל צופה';
      default:
        return 'לא ידוע';
    }
  }
}
