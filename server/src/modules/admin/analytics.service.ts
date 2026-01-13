import { prisma } from '../../lib/prisma';
import { TrackPageViewDto, GetAnalyticsQueryDto } from './analytics.validation';
import * as ExcelJS from 'exceljs';

export class AnalyticsService {
  // Track page view
  async trackPageView(userId: string | undefined, data: TrackPageViewDto, userAgent?: string) {
    await prisma.pageView.create({
      data: {
        path: data.path,
        userId,
        durationSeconds: data.durationSeconds,
        sessionId: data.sessionId,
        userAgent,
      },
    });
  }

  // Get overview statistics
  async getOverviewStats() {
    const [
      totalAds,
      pendingAds,
      totalUsers,
      usersByRole,
      recentPageViews,
      totalAppointments,
      appointmentsByStatus,
    ] = await Promise.all([
      // Total ads
      prisma.ad.count(),
      
      // Pending ads
      prisma.ad.count({ where: { status: 'PENDING' } }),
      
      // Total users
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      
      // Page views (last 7 days)
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Total appointments
      prisma.appointment.count(),
      
      // Appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Get ads by status
    const adsByStatus = await prisma.ad.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalAds,
      pendingAds,
      totalUsers,
      usersByRole: usersByRole.map((r: any) => ({ role: r.role, count: r._count })),
      adsByStatus: adsByStatus.map((s: any) => ({ status: s.status, count: s._count })),
      pageViews: {
        last7Days: recentPageViews,
      },
      appointments: {
        total: totalAppointments,
        byStatus: appointmentsByStatus.map((s: any) => ({ status: s.status, count: s._count })),
      },
    };
  }

  // Get page analytics with views
  async getPageAnalytics(query: GetAnalyticsQueryDto) {
    const { startDate, endDate } = query;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Group by path and get stats
    const pageStats = await prisma.pageView.groupBy({
      by: ['path'],
      where,
      _count: {
        _all: true,
      },
      _avg: {
        durationSeconds: true,
      },
    });

    return pageStats.map((stat: any) => ({
      path: stat.path,
      views: stat._count._all,
      avgDuration: Math.round(stat._avg.durationSeconds || 0),
    }));
  }

  // Export analytics to Excel
  async exportAnalyticsToExcel(query: GetAnalyticsQueryDto) {
    const analytics = await this.getPageAnalytics(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Page Analytics');

    // Headers
    worksheet.columns = [
      { header: 'Page Path', key: 'path', width: 50 },
      { header: 'Total Views', key: 'views', width: 15 },
      { header: 'Avg Duration (s)', key: 'avgDuration', width: 20 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data
    analytics.forEach((row: any) => {
      worksheet.addRow(row);
    });

    return workbook;
  }

  // Get ads with view counts
  async getAdsWithViews(filters?: { status?: string; categoryId?: string; limit?: number }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    const ads = await prisma.ad.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        createdAt: true,
        Category: {
          select: {
            nameHe: true,
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { views: 'desc' },
      take: filters?.limit || 100,
    });

    return ads;
  }
}

export const analyticsService = new AnalyticsService();
