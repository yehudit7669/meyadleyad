import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = (response.data as any).data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// NEW: Favorites Service
export const favoritesService = {
  getFavorites: async () => {
    const { data } = await api.get('/favorites');
    return data;
  },

  addFavorite: async (adId: string) => {
    const { data } = await api.post('/favorites', { adId });
    return data;
  },

  removeFavorite: async (adId: string) => {
    await api.delete(`/favorites/${adId}`);
  },
};

// NEW: Messages Service
export const messagesService = {
  getConversations: async () => {
    const { data } = await api.get('/messages/conversations');
    return data;
  },

  getMessages: async (conversationId: string) => {
    const { data } = await api.get(`/messages/${conversationId}`);
    return data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const { data } = await api.post(`/messages/${conversationId}`, { content });
    return data;
  },

  createConversation: async (recipientId: string, adId?: string) => {
    const { data } = await api.post('/messages/conversations', { recipientId, adId });
    return data;
  },

  markAsRead: async (conversationId: string) => {
    await api.patch(`/messages/${conversationId}/read`);
  },
};

// NEW: Reviews Service
export const reviewsService = {
  getReviews: async (targetId: string, targetType: 'user' | 'ad') => {
    const { data } = await api.get(`/reviews/${targetType}/${targetId}`);
    return data;
  },

  createReview: async (reviewData: {
    targetId: string;
    targetType: 'user' | 'ad';
    rating: number;
    comment: string;
  }) => {
    const { data } = await api.post('/reviews', reviewData);
    return data;
  },

  updateReview: async (id: string, updates: { rating?: number; comment?: string }) => {
    const { data } = await api.patch(`/reviews/${id}`, updates);
    return data;
  },

  deleteReview: async (id: string) => {
    await api.delete(`/reviews/${id}`);
  },

  respondToReview: async (id: string, response: string) => {
    const { data } = await api.post(`/reviews/${id}/respond`, { response });
    return data;
  },
};

// NEW: Search Service
export const searchService = {
  autocomplete: async (query: string) => {
    const { data } = await api.get('/search/autocomplete', {
      params: { q: query },
    });
    return data;
  },

  searchNearby: async (lat: number, lng: number, radius: number = 10) => {
    const { data } = await api.get('/search/nearby', {
      params: { lat, lng, radius },
    });
    return data;
  },
};

export default api;

// =============== AUTH SERVICES ===============
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return (response.data as any).data;
  },

  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await api.post('/auth/register', data);
    return (response.data as any).data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return (response.data as any).data;
  },

  updateProfile: async (data: { name?: string; phone?: string }) => {
    const response = await api.put('/users/profile', data);
    return (response.data as any).data;
  },

  // Email verification
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return (response.data as any).data;
  },

  // Password reset
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return (response.data as any).data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return (response.data as any).data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return (response.data as any).data;
    return response.data;
  },
};

// =============== ADS SERVICES ===============
export const adsService = {
  getAds: async (params?: {
    search?: string;
    categoryId?: string;
    cityId?: string;
    userId?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/ads', { params });
    return (response.data as any).data;
  },

  getAd: async (id: string) => {
    const response = await api.get(`/ads/${id}`);
    return (response.data as any).data;
  },

  createAd: async (data: any) => {
    // Create the ad first
    const response = await api.post('/ads', data);
    const ad = (response.data as any).data;
    
    // If there are images, upload them
    if (data.images && data.images.length > 0) {
      try {
        const formData = new FormData();
        for (const image of data.images) {
          if (image.file) {
            formData.append('images', image.file);
          }
        }
        
        await api.post(`/ads/${ad.id}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error) {
        console.error('Failed to upload images:', error);
        // Continue anyway - ad was created successfully
      }
    }
    
    return ad;
  },

  updateAd: async (id: string, data: any) => {
    // Update the ad basic info first
    const response = await api.put(`/ads/${id}`, {
      title: data.title,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      cityId: data.cityId,
      streetId: data.streetId,
      customFields: data.customFields,
    });
    const ad = (response.data as any).data;
    
    // If there are new images to upload (with file objects)
    if (data.images && data.images.length > 0) {
      const newImages = data.images.filter((img: any) => img.file);
      
      if (newImages.length > 0) {
        try {
          const formData = new FormData();
          for (const image of newImages) {
            formData.append('images', image.file);
          }
          
          await api.post(`/ads/${ad.id}/images`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (error) {
          console.error('Failed to upload new images:', error);
          throw error;
        }
      }
    }
    
    return ad;
  },

  deleteAd: async (id: string) => {
    const response = await api.delete(`/ads/${id}`);
    return response.data as any;
  },

  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/ads/images/${imageId}`);
    return response.data as any;
  },

  getMyAds: async () => {
    const response = await api.get('/users/my-ads');
    return (response.data as any).data.ads;
  },

  incrementContactClick: async (id: string) => {
    const response = await api.post(`/ads/${id}/contact-click`);
    return response.data as any;
  },
};

// =============== CATEGORIES SERVICES ===============
export const categoriesService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return (response.data as any).data;
  },

  getCategoryBySlug: async (slug: string) => {
    const response = await api.get(`/categories/${slug}`);
    return (response.data as any).data;
  },
};

// =============== CITIES SERVICES ===============
export const citiesService = {
  getCities: async () => {
    const response = await api.get('/cities');
    return (response.data as any).data;
  },

  getCityBySlug: async (slug: string) => {
    const response = await api.get(`/cities/slug/${slug}`);
    return (response.data as any).data;
  },
  
  getBeitShemesh: async () => {
    const response = await api.get('/streets/city/beit-shemesh');
    return response.data as any;
  },
};

// =============== STREETS SERVICES ===============
export const streetsService = {
  getStreets: async (params?: { query?: string; cityId?: string; limit?: number }) => {
    const response = await api.get('/streets', { params });
    return response.data as any;
  },

  getStreetById: async (id: string) => {
    const response = await api.get(`/streets/${id}`);
    return response.data as any;
  },
};

// =============== USERS SERVICES ===============
export const usersService = {
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return (response.data as any).data;
  },
};

// =============== ADMIN SERVICES ===============
export const adminService = {
  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return (response.data as any).data;
  },

  getPendingAds: async (filters?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    cityId?: string;
    cityName?: string;
    publisher?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.cityId) params.append('cityId', filters.cityId);
    if (filters?.cityName) params.append('cityName', filters.cityName);
    if (filters?.publisher) params.append('publisher', filters.publisher);

    const response = await api.get(`/admin/ads/pending?${params.toString()}`);
    return (response.data as any).data;
  },

  getAdById: async (id: string) => {
    const response = await api.get(`/admin/ads/${id}`);
    return (response.data as any).data;
  },

  approveAd: async (id: string) => {
    const response = await api.post(`/admin/ads/${id}/approve`);
    return response.data as any;
  },

  rejectAd: async (id: string, reason: string) => {
    const response = await api.post(`/admin/ads/${id}/reject`, { reason });
    return response.data as any;
  },

  getAllAds: async (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/admin/ads?${params.toString()}`);
    // השרת מחזיר { status: 'success', data: { ads: [...], pagination: {...} } }
    return (response.data as any).data || { ads: [], pagination: { page: 1, totalPages: 1, total: 0 } };
  },

  updateAdStatus: async (id: string, status: string) => {
    const response = await api.patch(`/admin/ads/${id}/status`, { status });
    return response.data as any;
  },

  exportAdsHistory: async (filters: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
    statuses?: string[];
  }) => {
    const response = await api.post('/admin/ads/export-history', filters, {
      responseType: 'blob'
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users', {
      params: {
        page: 1,
        limit: 100
      }
    });
    return (response.data as any).users || [];
  },
  // =============== ADMIN CATEGORY SERVICES ===============
  adminCategoriesService: {
    getCategories: async () => {
      const response = await api.get('/admin/categories');
      return response.data;
    },
    getCategory: async (id: string) => {
      const response = await api.get(`/admin/categories/${id}`);
      return response.data;
    },
    createCategory: async (data: any) => {
      const response = await api.post('/admin/categories', data);
      return response.data;
    },
    updateCategory: async (id: string, data: any) => {
      const response = await api.patch(`/admin/categories/${id}`, data);
      return response.data;
    },
    deleteCategory: async (id: string) => {
      const response = await api.delete(`/admin/categories/${id}`);
      return response.data;
    },
    reorderCategories: async (orders: { id: string; order: number }[]) => {
      const response = await api.post('/admin/categories/reorder', { orders });
      return response.data;
    },
  },
  getUserDetails: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`);
    return (response.data as any).data;
  },
  exportUsers: async () => {
    const response = await api.get('/admin/users/export/excel', { responseType: 'blob' });
    return response.data;
  },
  updateMeetingAccess: async (userId: string, blocked: boolean, reason: string) => {
    await api.patch(`/admin/users/${userId}/meeting-access`, { blocked, reason });
  },

  getAnalyticsPages: async () => {
    const response = await api.get('/admin/analytics/pages');
    return (response.data as any).data || [];
  },
  getAnalyticsExport: async () => {
    const response = await api.get('/admin/analytics/export/excel', { responseType: 'blob' });
    return response.data;
  },

  getAdminAppointments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
    searchBy?: 'userName' | 'phone' | 'propertyAddress';
    sortBy?: 'createdAt' | 'date' | 'status';
    sortDir?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/admin/appointments', { params });
    return response.data;
  },

  getAdminAppointmentById: async (id: string) => {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  },

  updateAppointmentStatus: async (id: string, data: { status: string; reason?: string }) => {
    const response = await api.patch(`/admin/appointments/${id}/status`, data);
    return response.data;
  },

  cancelAdminAppointment: async (id: string, reason: string) => {
    const response = await api.post(`/admin/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  // NEW: Mailing Service
  getMailingSubscribers: async () => {
    const response = await api.get('/admin/content-distribution/subscribers');
    return (response.data as any).data || [];
  },
  getMailingStats: async () => {
    const response = await api.get('/admin/content-distribution/dispatch-logs');
    return (response.data as any).data || {};
  },
  getMailingExport: async () => {
    const response = await api.get('/admin/content-distribution/export/csv', { responseType: 'blob' });
    return response.data;
  },
  resendMailingContent: async () => {
    await api.post('/admin/content-distribution/dispatch');
  },

  exportAdA4PDF: async (adId: string) => {
    const response = await api.get(`/admin/pdf-export/ads/${adId}/export-a4`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-${adId}-a4.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// =============== PARASHA SERVICES ===============
export interface ParashaInfo {
  name: string;
  date: string; // ISO format (YYYY-MM-DD)
  hebrewDate: string;
}

export const parashaService = {
  getUpcoming: async (limit: number = 30): Promise<ParashaInfo[]> => {
    const response = await api.get(`/parasha/upcoming?limit=${limit}`);
    return response.data as ParashaInfo[];
  },

  validate: async (name: string): Promise<boolean> => {
    const response = await api.get(`/parasha/validate/${encodeURIComponent(name)}`);
    return (response.data as any).valid;
  },
};

// =============== PROFILE SERVICES ===============
export const profileService = {
  // Preferences
  getPreferences: async () => {
    const response = await api.get('/profile/preferences');
    return (response.data as any).data;
  },

  updatePreferences: async (data: any) => {
    const response = await api.patch('/profile/preferences', data);
    return (response.data as any).data;
  },

  // My Ads
  getMyAds: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/profile/my-ads', { params });
    return (response.data as any).data;
  },

  deleteMyAd: async (adId: string) => {
    const response = await api.delete(`/profile/ads/${adId}`);
    return response.data as any;
  },

  // Favorites
  getFavorites: async (limit?: number) => {
    const response = await api.get('/profile/favorites', { params: { limit } });
    return (response.data as any).data;
  },

  addFavorite: async (adId: string) => {
    const response = await api.post('/profile/favorites', { adId });
    return response.data as any;
  },

  removeFavorite: async (adId: string) => {
    const response = await api.delete(`/profile/favorites/${adId}`);
    return response.data as any;
  },

  // Personal Details
  getPersonalDetails: async () => {
    const response = await api.get('/profile/me');
    return (response.data as any).data;
  },

  updatePersonalDetails: async (data: { name?: string; phone?: string }) => {
    const response = await api.patch('/profile/me', data);
    return (response.data as any).data;
  },

  // Appointments
  getAppointments: async () => {
    const response = await api.get('/profile/appointments');
    return (response.data as any).data;
  },

  createAppointment: async (data: { adId: string; startsAt: string; notes?: string }) => {
    const response = await api.post('/profile/appointments', data);
    return (response.data as any).data;
  },

  cancelAppointment: async (appointmentId: string) => {
    const response = await api.patch(`/profile/appointments/${appointmentId}/cancel`);
    return response.data as any;
  },

  // Account Management
  requestAccountDeletion: async () => {
    const response = await api.post('/profile/account/delete-request');
    return response.data as any;
  },

  // Audit Log
  getAuditLog: async (limit?: number) => {
    const response = await api.get('/profile/audit-log', { params: { limit } });
    return (response.data as any).data;
  },
};

// Appointments Service (מערכת פגישות להצגת נכסים)
export const appointmentsService = {
  // בקשת פגישה חדשה
  requestAppointment: async (data: {
    adId: string;
    date: string; // ISO date string
    note?: string;
  }) => {
    const response = await api.post('/appointments', data);
    return (response.data as any).data;
  },

  // הפגישות שלי (כמבקש)
  getMyAppointments: async () => {
    const response = await api.get('/appointments/me');
    return (response.data as any).data;
  },

  // פגישות לנכסים שלי (כבעל מודעה)
  getOwnerAppointments: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/appointments/owner', { params });
    return (response.data as any).data;
  },

  // אישור/דחייה/הצעת מועד (כבעל מודעה)
  ownerAction: async (data: {
    appointmentId: string;
    action: 'APPROVE' | 'REJECT' | 'RESCHEDULE';
    newDate?: string;
    reason?: string;
  }) => {
    const response = await api.post('/appointments/owner/action', data);
    return (response.data as any).data;
  },

  // קבלת זמינות מודעה (פומבי)
  getAdAvailability: async (adId: string) => {
    const response = await api.get(`/appointments/availability/${adId}`);
    return (response.data as any).data;
  },

  // קביעת זמינות למודעה שלי
  setAdAvailability: async (data: {
    adId: string;
    slots: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  }) => {
    const response = await api.post('/appointments/availability', data);
    return (response.data as any).data;
  },

  // אישור מועד חלופי על ידי המבקש
  confirmReschedule: async (appointmentId: string) => {
    const response = await api.post(`/appointments/confirm-reschedule/${appointmentId}`);
    return (response.data as any).data;
  },

  // ביטול פגישה על ידי המבקש
  cancelAppointment: async (appointmentId: string) => {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return (response.data as any).data;
  },
};

// Admin Appointments Service
export const adminAppointmentsService = {
  getUserPolicy: async (userId: string) => {
    const response = await api.get(`/admin/appointments/appointment-policy/${userId}`);
    return (response.data as any).data;
  },

  setUserPolicy: async (data: {
    userId: string;
    isBlocked: boolean;
    blockReason?: string;
  }) => {
    const response = await api.patch('/admin/appointments/appointment-policy', data);
    return (response.data as any).data;
  },
};

// =============== SERVICE PROVIDER SERVICES ===============
export const serviceProviderService = {
  // Get service provider profile
  getProfile: async () => {
    const response = await api.get('/service-providers/profile/me');
    return (response.data as any).data;
  },

  // Update service provider profile
  updateProfile: async (data: any) => {
    const response = await api.patch('/service-providers/profile/me', data);
    return (response.data as any).data;
  },

  // Request office address change
  requestOfficeAddressChange: async (newAddress: string) => {
    const response = await api.post('/service-providers/profile/office-address-request', { newAddress });
    return response.data as any;
  },

  // Request data export
  requestDataExport: async () => {
    const response = await api.post('/service-providers/account/export-request');
    return response.data as any;
  },

  // Request account deletion
  requestAccountDeletion: async (reason?: string) => {
    const response = await api.post('/service-providers/account/delete-request', { reason });
    return response.data as any;
  },

  // Request highlight
  requestHighlight: async (data: { requestType: 'SERVICE_CARD' | 'BUSINESS_PAGE'; reason?: string }) => {
    const response = await api.post('/service-providers/highlight-request', data);
    return response.data as any;
  },

  // Get public profile
  getPublicProfile: async (id: string) => {
    const response = await api.get(`/service-providers/${id}`);
    return (response.data as any).data;
  },

  // Get audit log
  getAuditLog: async (limit?: number) => {
    const response = await api.get('/service-providers/audit-log', { params: { limit } });
    return (response.data as any).data;
  },
};

// =============== BROKER SERVICES ===============
export const brokerService = {
  // Get audit log
  getAuditLog: async (limit?: number) => {
    const response = await api.get('/broker/audit-log', { params: { limit } });
    return (response.data as any).data;
  },
};

