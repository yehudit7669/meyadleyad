import api from './api';

interface DashboardSummary {
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  draftAds: number;
  expiredAds: number;
  totalUsers: number;
  regularUsers: number;
  brokers: number;
  serviceProviders: number;
  admins: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  approvedAppointments: number;
  pendingAppointments: number;
  canceledAppointments: number;
  recentWatermarks: number;
}

interface ActionItem {
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  link: string;
}

interface UsageItem {
  page: string;
  views: number;
  avgTime: string;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

export const adminDashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get('/admin/dashboard/summary');
    return ((response.data as any).data || response.data) as DashboardSummary;
  },

  async getActions(): Promise<ActionItem[]> {
    const response = await api.get('/admin/dashboard/actions');
    return ((response.data as any).data || response.data) as ActionItem[];
  },

  async getUsage(): Promise<UsageItem[]> {
    const response = await api.get('/admin/dashboard/usage');
    return ((response.data as any).data || response.data) as UsageItem[];
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const response = await api.get('/admin/dashboard/recent-activity');
    return ((response.data as any).data || response.data) as ActivityItem[];
  },

  async exportUsage(): Promise<void> {
    const response = await api.post(
      '/admin/dashboard/usage/export',
      {},
      {
        responseType: 'blob'
      }
    );

    // Download the file
    const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `usage-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
