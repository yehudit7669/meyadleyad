import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is required');
}

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
    const response = await axios.get(`${API_URL}/admin/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return ((response.data as any).data || response.data) as DashboardSummary;
  },

  async getActions(): Promise<ActionItem[]> {
    const response = await axios.get(`${API_URL}/admin/dashboard/actions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return ((response.data as any).data || response.data) as ActionItem[];
  },

  async getUsage(): Promise<UsageItem[]> {
    const response = await axios.get(`${API_URL}/admin/dashboard/usage`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return ((response.data as any).data || response.data) as UsageItem[];
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const response = await axios.get(`${API_URL}/admin/dashboard/recent-activity`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return ((response.data as any).data || response.data) as ActivityItem[];
  },

  async exportUsage(): Promise<void> {
    const response = await axios.post(
      `${API_URL}/admin/dashboard/usage/export`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
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
