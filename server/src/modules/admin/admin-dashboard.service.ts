import { PrismaClient, AdStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminDashboardService {
  /**
   * סטטיסטיקות כוללות - אופטימיזציה בשאילתה אחת
   */
  async getSummary() {
    // ספירת מודעות לפי סטטוס
    const [
      totalAds,
      activeAds,
      pendingAds,
      draftAds,
      expiredAds,
      totalUsers,
      regularUsers,
      brokers,
      serviceProviders,
      admins,
      appointmentsThisWeek,
      appointmentsThisMonth,
      approvedAppointments,
      pendingAppointments,
      canceledAppointments,
      recentWatermarks
    ] = await Promise.all([
      // מודעות
      prisma.ad.count(),
      prisma.ad.count({ where: { status: AdStatus.ACTIVE } }),
      prisma.ad.count({ where: { status: AdStatus.PENDING } }),
      prisma.ad.count({ where: { status: AdStatus.DRAFT } }),
      prisma.ad.count({ where: { status: AdStatus.EXPIRED } }),
      
      // משתמשים
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'BROKER' } }),
      prisma.user.count({ where: { userType: 'SERVICE_PROVIDER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      
      // תיאומי פגישות - אם קיים
      this.countAppointmentsThisWeek(),
      this.countAppointmentsThisMonth(),
      this.countAppointmentsByStatus('APPROVED'),
      this.countAppointmentsByStatus('PENDING'),
      this.countAppointmentsByStatus('REJECTED'),
      
      // Watermarks - ספירה אם קיימת טבלת Watermark, אחרת 0
      this.countRecentWatermarks()
    ]);

    return {
      // מודעות
      totalAds,
      activeAds,
      pendingAds,
      draftAds,
      expiredAds,
      
      // משתמשים
      totalUsers,
      regularUsers,
      brokers,
      serviceProviders,
      admins,
      
      // פגישות
      appointmentsThisWeek,
      appointmentsThisMonth,
      approvedAppointments,
      pendingAppointments,
      canceledAppointments,
      
      // Watermark
      recentWatermarks
    };
  }

  /**
   * נקודות פעולה דחופות
   */
  async getActionItems() {
    const actions = [];

    // מודעות ממתינות
    const pendingCount = await prisma.ad.count({ where: { status: AdStatus.PENDING } });
    if (pendingCount > 0) {
      actions.push({
        title: 'מודעות ממתינות לאישור',
        description: `${pendingCount} מודעות ממתינות לבדיקה`,
        urgency: pendingCount > 10 ? 'HIGH' : pendingCount > 5 ? 'MEDIUM' : 'LOW',
        link: '/admin/pending'
      });
    }

    // פגישות ממתינות (אם קיים)
    try {
      const pendingAppointments = await prisma.appointment.count({ 
        where: { status: 'PENDING' } 
      });
      if (pendingAppointments > 5) {
        actions.push({
          title: 'פגישות ממתינות לתגובה',
          description: `${pendingAppointments} פגישות ממתינות לטיפול`,
          urgency: 'MEDIUM',
          link: '/admin/appointments'
        });
      }
    } catch (error) {
      // אם אין טבלת appointments - להתעלם
    }

    // TODO: הוסף בדיקות נוספות:
    // - משתמשים חסומים מתיאום (כאשר יהיה השדה הנכון ב-schema)
    // - ייבואים שנכשלו
    // - חריגות תוכן

    return actions;
  }

  /**
   * נתוני שימוש במערכת
   * TODO: כאשר יהיה tracking מלא, להחזיר נתונים אמיתיים
   */
  async getUsageStats() {
    // כרגע placeholder - בעתיד לקרוא מטבלת Analytics אם תהיה
    return [
      { page: 'דף הבית', views: 0, avgTime: '0:00' },
      { page: 'חיפוש מודעות', views: 0, avgTime: '0:00' },
      { page: 'פרטי מודעה', views: 0, avgTime: '0:00' },
    ];
  }

  /**
   * פעילות אחרונה
   */
  async getRecentActivity() {
    const activities: any[] = [];

    // מודעות שאושרו לאחרונה
    const recentApprovedAds = await prisma.ad.findMany({
      where: { status: AdStatus.APPROVED },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true
      }
    });

    recentApprovedAds.forEach(ad => {
      activities.push({
        type: 'APPROVED',
        description: `מודעה "${ad.title}" אושרה`,
        timestamp: this.formatTimestamp(ad.updatedAt)
      });
    });

    // מודעות שנדחו לאחרונה
    const recentRejectedAds = await prisma.ad.findMany({
      where: { status: AdStatus.REJECTED },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        updatedAt: true
      }
    });

    recentRejectedAds.forEach(ad => {
      activities.push({
        type: 'REJECTED',
        description: `מודעה "${ad.title}" נדחתה`,
        timestamp: this.formatTimestamp(ad.updatedAt)
      });
    });

    // TODO: הוסף פעילויות נוספות מ-AuditLog אם קיים

    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10);
  }

  /**
   * ייצוא נתוני שימוש ל-CSV
   */
  async exportUsageToCsv() {
    const usage = await this.getUsageStats();
    
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += 'עמוד,צפיות,זמן ממוצע\n';
    
    usage.forEach(item => {
      csv += `"${item.page}",${item.views},"${item.avgTime}"\n`;
    });

    return csv;
  }

  // Helper methods
  private async countAppointmentsThisWeek(): Promise<number> {
    try {
      return await prisma.appointment.count({
        where: {
          createdAt: {
            gte: this.getStartOfWeek()
          }
        }
      });
    } catch (error) {
      return 0;
    }
  }

  private async countAppointmentsThisMonth(): Promise<number> {
    try {
      return await prisma.appointment.count({
        where: {
          createdAt: {
            gte: this.getStartOfMonth()
          }
        }
      });
    } catch (error) {
      return 0;
    }
  }

  private async countAppointmentsByStatus(status: string): Promise<number> {
    try {
      return await prisma.appointment.count({
        where: { status: status as any }
      });
    } catch (error) {
      return 0;
    }
  }

  private getStartOfWeek(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private async countRecentWatermarks(): Promise<number> {
    try {
      // TODO: אם יש טבלת Watermark, לספור כאן
      // לדוגמה: prisma.watermark.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'עכשיו';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    if (days < 7) return `לפני ${days} ימים`;
    
    return date.toLocaleDateString('he-IL');
  }
}
