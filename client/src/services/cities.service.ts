import api from './api';
import { City } from '../types';

export const citiesService = {
  async getCities() {
    const response = await api.get<{ data: City[] }>('/cities');
    return response.data.data;
  },

  async getCityBySlug(slug: string) {
    const response = await api.get<{ data: City }>(`/cities/${slug}`);
    return response.data.data;
  },
};
