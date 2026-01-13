import api from './api';
import { Ad, PaginatedResponse } from '../types';

export const adsService = {
  async getAds(filters?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    cityId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const response = await api.get<{ data: PaginatedResponse<Ad> }>('/ads', {
      params: filters,
    });
    return response.data.data;
  },

  async getAd(id: string) {
    const response = await api.get<{ data: Ad }>(`/ads/${id}`);
    return response.data.data;
  },

  async createAd(data: {
    title: string;
    description: string;
    price?: number;
    categoryId: string;
    cityId?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    customFields?: Record<string, any>;
  }) {
    console.log('Creating ad with data:', data);
    try {
      const response = await api.post<{ data: Ad }>('/ads', data);
      console.log('Ad created successfully:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create ad:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  async updateAd(id: string, data: Partial<{
    title: string;
    description: string;
    price?: number;
    categoryId: string;
    cityId?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    customFields?: Record<string, any>;
  }>) {
    const response = await api.put<{ data: Ad }>(`/ads/${id}`, data);
    return response.data.data;
  },

  async deleteAd(id: string) {
    await api.delete(`/ads/${id}`);
  },

  async uploadImages(adId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<{ data: Ad }>(`/ads/${adId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteImage(imageId: string) {
    await api.delete(`/ads/images/${imageId}`);
  },

  async incrementContactClick(adId: string) {
    await api.post(`/ads/${adId}/contact-click`);
  },
};
