import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  roleType: string;
  status: string;
  createdAt: string;
  adsCount: number;
  meetingsBlocked: boolean;
  emailDigestStatus: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  meetingsBlocked: boolean;
  meetingsBlockReason: string | null;
  meetingsBlockedAt: string | null;
  weeklyDigestOptIn: boolean;
  notifyNewMatches: boolean | null;
  adsCount: number;
  ads: Array<{
    id: string;
    address: string;
    createdAt: string;
    status: string;
    viewsCount: number;
    serialNumber: number;
    previewLink: string;
  }>;
  auditHistory: Array<{
    id: string;
    action: string;
    meta: any;
    createdAt: string;
  }>;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  q?: string;
  searchBy?: 'name' | 'email' | 'id';
  roleType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'name' | 'email' | 'adsCount';
  sortDir?: 'asc' | 'desc';
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  roleType?: string;
  status?: string;
  weeklyDigestOptIn?: boolean;
  notifyNewMatches?: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role: string;
}

export const usersAdminService = {
  /**
   * Get users list
   */
  getUsers: async (params: GetUsersParams = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Create new user (Super Admin only)
   */
  createUser: async (data: CreateUserData) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  /**
   * Get user profile by ID
   */
  getUserProfile: async (userId: string): Promise<{ data: UserProfile }> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Update user details
   */
  updateUser: async (userId: string, data: UpdateUserData) => {
    const response = await api.patch(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Block/unblock meetings for user
   */
  setMeetingsBlock: async (userId: string, blocked: boolean, reason?: string) => {
    const response = await api.post(`/admin/users/${userId}/meetings-block`, {
      blocked,
      reason,
    });
    return response.data;
  },

  /**
   * Hard delete user (Super Admin only)
   */
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Bulk remove all ads of a user (Super Admin only)
   */
  bulkRemoveUserAds: async (userId: string, reason: string) => {
    const response = await api.post(`/admin/users/${userId}/ads/bulk-remove`, {
      reason,
    });
    return response.data;
  },

  /**
   * Export users (Admin & Super Admin only)
   */
  exportUsers: async (params: GetUsersParams = {}) => {
    const response = await api.post('/admin/users/export', {}, {
      params,
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `users-export-${timestamp}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },
};
