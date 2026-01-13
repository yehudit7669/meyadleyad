import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: 'USER' | 'BROKER';
    companyName?: string;
    licenseNumber?: string;
  }) {
    console.log('authService.register - sending request:', { ...data, password: '***' });
    const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
    console.log('authService.register - response received:', { status: response.status, hasData: !!response.data });
    return response.data.data;
  },

  async login(email: string, password: string) {
    console.log('authService.login - sending request:', { email });
    const response = await api.post<{ data: AuthResponse }>('/auth/login', {
      email,
      password,
    });
    console.log('authService.login - response received:', { status: response.status, hasData: !!response.data });
    return response.data.data;
  },

  async googleAuth(token: string) {
    const response = await api.post<{ data: AuthResponse }>('/auth/google', { token });
    return response.data.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async getCurrentUser() {
    const response = await api.get<{ data: User }>('/users/profile');
    return response.data.data;
  },
};
