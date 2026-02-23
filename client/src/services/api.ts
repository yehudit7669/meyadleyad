import axios from 'axios';
import env from '../utils/env'

const API_URL = env.VITE_API_URL || env.API_URL;

if (!API_URL) {
  console.log("MODE:", import.meta.env.MODE);
  console.log("DEV:", import.meta.env.DEV);
  console.log("VITE_API_URL value:", import.meta.env.VITE_API_URL);
  console.log("ALL VITE KEYS:", Object.keys(import.meta.env).filter(k => k.startsWith("VITE_")));
  throw new Error("Missing VITE_API_URL in production");
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

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
    adType?: string;
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
    // Get current user to check if they're an admin
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN');
    
    // Update the ad basic info first
    const response = await api.put(`/ads/${id}`, {
      title: data.title,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      cityId: data.cityId,
      streetId: data.streetId,
      customFields: data.customFields,
      images: data.images, // שולח את כל מערך התמונות (כולל חדשות עם base64 וקיימות עם URLs)
    });
    const ad = (response.data as any).data;
    
    // מעלים תמונות חדשות ישירות אם:
    // 1. המודעה לא ACTIVE (משתמש רגיל)
    // 2. המשתמש הוא מנהל (גם אם המודעה ACTIVE)
    if ((ad.status !== 'ACTIVE' || isAdmin) && data.images && data.images.length > 0) {
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
    // console.log("=".repeat(10) + " CATEGORY SERVICE " + "=".repeat(10));
    // console.log("Fetching category by slug:", slug);
    // console.log("API URL:", API_URL);
    // console.log('api axios base url', api.defaults.baseURL);
    // console.log("Requesting:", `/categories/${slug}`);
    // console.log("axios", api);
    // console.log("env", import.meta.env);
    // console.log("=".repeat(30));

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

// =============== NEIGHBORHOODS SERVICES ===============
export const neighborhoodsService = {
  getNeighborhoods: async (cityId?: string) => {
    const params = cityId ? { cityId } : {};
    const response = await api.get('/neighborhoods', { params });
    return (response.data as any).data;
  },

  getNeighborhoodById: async (id: string) => {
    const response = await api.get(`/neighborhoods/${id}`);
    return (response.data as any).data;
  },
};

// =============== USERS SERVICES ===============
export const usersService = {
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return (response.data as any).data;
  },

  getMyAds: async () => {
    const response = await api.get('/users/my-ads');
    return (response.data as any).data || [];
  },

  getBrokers: async (cityId?: string) => {
    const params = cityId ? { cityId } : {};
    const response = await api.get('/users/brokers', { params });
    return (response.data as any).data || [];
  },

  getServiceProviders: async (cityId?: string) => {
    const params = cityId ? { cityId } : {};
    const response = await api.get('/users/service-providers', { params });
    return (response.data as any).data || [];
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

  // Approve ad and create distribution items (PENDING status)
  approveAdWithPendingDistribution: async (id: string) => {
    // First approve
    await api.post(`/admin/ads/${id}/approve`);
    // Then create distribution with PENDING status
    const response = await api.post(`/admin/whatsapp/listings/${id}/create-distribution`, { status: 'PENDING' });
    return response.data as any;
  },

  // Approve ad and create distribution items (IN_PROGRESS status for manual sending)
  approveAdWithInProgressDistribution: async (id: string) => {
    // Approve and create SENT distribution items in one call
    const response = await api.post(`/admin/ads/${id}/approve-and-whatsapp`);
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
    adNumber?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.adNumber) params.append('adNumber', filters.adNumber);

    const response = await api.get(`/admin/ads?${params.toString()}`);
    // השרת מחזיר { status: 'success', data: { ads: [...], pagination: {...} } }
    return (response.data as any).data || { ads: [], pagination: { page: 1, totalPages: 1, total: 0 } };
  },

  updateAdStatus: async (id: string, status: string, reason?: string) => {
    const body: { status: string; reason?: string } = { status };
    if (reason) {
      body.reason = reason;
    }
    const response = await api.patch(`/admin/ads/${id}/status`, body);
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

  // ✅ שינויים ממתינים
  getAdsWithPendingChanges: async (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/admin/ads/pending-changes?${params.toString()}`);
    return (response.data as any).data;
  },

  approvePendingChanges: async (adId: string) => {
    const response = await api.post(`/admin/ads/${adId}/approve-changes`);
    return (response.data as any).data;
  },

  rejectPendingChanges: async (adId: string, reason?: string) => {
    const response = await api.post(`/admin/ads/${adId}/reject-changes`, { reason });
    return (response.data as any).data;
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
    const url = window.URL.createObjectURL(response.data as Blob);
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

// =============== IMPORT HISTORY SERVICES ===============
export const importHistoryService = {
  // Get import history
  getImportHistory: async (params?: {
    page?: number;
    limit?: number;
    importType?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.importType) queryParams.append('importType', params.importType);

    const response = await api.get(`/admin/import-history?${queryParams.toString()}`);
    return (response.data as any).data;
  },

  // Get import details
  getImportDetails: async (id: string) => {
    const response = await api.get(`/admin/import-history/${id}`);
    return (response.data as any).data;
  },

  // Check if import has approved properties
  checkApprovedProperties: async (id: string) => {
    const response = await api.get(`/admin/import-history/${id}/check-approved-properties`);
    return (response.data as any).data;
  },

  // Check if cities/streets have approved ads
  checkApprovedAdsCitiesStreets: async (id: string) => {
    const response = await api.get(`/admin/import-history/${id}/check-approved-ads-cities-streets`);
    return (response.data as any).data;
  },

  // Delete imported properties
  deleteImportedProperties: async (id: string, includeApproved: boolean) => {
    const response = await api.delete(`/admin/import-history/${id}/properties?includeApproved=${includeApproved}`);
    return response.data as any;
  },

  // Delete imported cities/streets
  deleteImportedCitiesStreets: async (id: string, deleteWithApprovedAds: boolean) => {
    const response = await api.delete(`/admin/import-history/${id}/cities-streets?deleteWithApprovedAds=${deleteWithApprovedAds}`);
    return response.data as any;
  },
};

// =============== PENDING APPROVALS SERVICES ===============
export const pendingApprovalsService = {
  // Get all pending approvals (admin only)
  getAll: async (filters?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    type?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const response = await api.get(`/admin/pending-approvals?${params.toString()}`);
    return (response.data as any).data;
  },

  // Get approval by ID
  getById: async (id: string) => {
    const response = await api.get(`/admin/pending-approvals/${id}`);
    return (response.data as any).data;
  },

  // Create approval request
  create: async (data: {
    type: string;
    requestData: any;
    oldData?: any;
    reason?: string;
  }) => {
    const response = await api.post('/approvals', data);
    return response.data as any;
  },

  // Approve approval
  approve: async (id: string, adminNotes?: string) => {
    const response = await api.patch(`/admin/pending-approvals/${id}/approve`, { adminNotes });
    return response.data as any;
  },

  // Reject approval
  reject: async (id: string, adminNotes?: string) => {
    const response = await api.patch(`/admin/pending-approvals/${id}/reject`, { adminNotes });
    return response.data as any;
  },

  // Get my approvals (user)
  getMyApprovals: async () => {
    const response = await api.get('/approvals/my/approvals');
    return (response.data as any).data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/admin/pending-approvals/stats');
    return (response.data as any).data;
  },

  // Get pending count
  getPendingCount: async () => {
    const response = await api.get('/admin/pending-approvals/pending-count');
    return (response.data as any).data;
  },
};

// WhatsApp Distribution Service
export const whatsappService = {
  // Distribution Queue
  getQueue: async (filters?: { status?: string; categoryId?: string; cityId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.cityId) params.append('cityId', filters.cityId);
    const response = await api.get(`/admin/whatsapp/queue?${params.toString()}`);
    return (response.data as any).data;
  },

  startSending: async () => {
    const response = await api.post('/admin/whatsapp/start-sending');
    return (response.data as any).data;
  },

  markItemAsInProgress: async (itemId: string) => {
    const response = await api.post(`/admin/whatsapp/queue/${itemId}/mark-in-progress`);
    return (response.data as any).data;
  },

  cancelSending: async (itemId: string) => {
    const response = await api.post(`/admin/whatsapp/queue/${itemId}/cancel-sending`);
    return (response.data as any).data;
  },

  markItemAsSent: async (itemId: string) => {
    const response = await api.post(`/admin/whatsapp/queue/${itemId}/mark-sent`);
    return (response.data as any).data;
  },

  // Get message text for an ad
  getAdMessageText: async (adId: string) => {
    const response = await api.get(`/admin/whatsapp/listings/${adId}/message-text`);
    return (response.data as any).data;
  },

  copyMessage: async (itemId: string) => {
    const response = await api.post(`/admin/whatsapp/items/${itemId}/copy`);
    return (response.data as any).data;
  },

  deferItem: async (itemId: string, hours: number) => {
    const response = await api.post(`/admin/whatsapp/items/${itemId}/defer`, { hours });
    return (response.data as any).data;
  },

  resendItem: async (itemId: string, groupId?: string) => {
    const response = await api.post(`/admin/whatsapp/items/${itemId}/override-resend`, { groupId });
    return (response.data as any).data;
  },

  // Groups Management
  getGroups: async (filters?: { status?: string; categoryId?: string; cityId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.cityId) params.append('cityId', filters.cityId);
    const response = await api.get(`/admin/whatsapp/groups?${params.toString()}`);
    return (response.data as any).data;
  },

  createGroup: async (groupData: {
    name: string;
    inviteLink?: string;
    categoryScopes?: string[];
    cityScopes?: string[];
    dailyQuota?: number;
    status?: string;
  }) => {
    const response = await api.post('/admin/whatsapp/groups', groupData);
    return (response.data as any).data;
  },

  updateGroup: async (groupId: string, groupData: Partial<{
    name: string;
    inviteLink?: string;
    categoryScopes?: string[];
    cityScopes?: string[];
    dailyQuota?: number;
    status: string;
  }>) => {
    const response = await api.patch(`/admin/whatsapp/groups/${groupId}`, groupData);
    return (response.data as any).data;
  },

  deleteGroup: async (groupId: string) => {
    const response = await api.delete(`/admin/whatsapp/groups/${groupId}`);
    return response.data as any;
  },

  // Group Suggestions
  getSuggestions: async () => {
    const response = await api.get('/admin/whatsapp/groups/suggestions');
    return (response.data as any).data;
  },

  suggestGroup: async (suggestionData: {
    groupName: string;
    phoneNumber?: string;
    inviteLink?: string;
    description?: string;
    categoryId?: string;
    cityId?: string;
  }) => {
    const response = await api.post('/admin/whatsapp/suggestions', suggestionData);
    return (response.data as any).data;
  },

  approveSuggestion: async (suggestionId: string) => {
    const response = await api.post(`/admin/whatsapp/suggestions/${suggestionId}/approve`);
    return (response.data as any).data;
  },

  rejectSuggestion: async (suggestionId: string, reason?: string) => {
    const response = await api.post(`/admin/whatsapp/suggestions/${suggestionId}/reject`, { reason });
    return (response.data as any).data;
  },

  // Dashboard & Reports
  getDashboard: async () => {
    const response = await api.get('/admin/whatsapp/dashboard');
    return (response.data as any).data;
  },

  getDailyReport: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/admin/whatsapp/reports/daily${params}`);
    return (response.data as any).data;
  },

  // Digest Management
  createDigest: async (date: string, categoryId?: string) => {
    const response = await api.post('/admin/whatsapp/digest', { date, categoryId });
    return (response.data as any).data;
  },

  // Approve ad and send to WhatsApp
  approveAdAndWhatsApp: async (adId: string) => {
    const response = await api.post(`/admin/ads/${adId}/approve-and-whatsapp`);
    return (response.data as any).data;
  },
};


