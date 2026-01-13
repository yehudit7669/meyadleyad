import api from './api';
import { Category } from '../types';

export const categoriesService = {
  async getCategories() {
    const response = await api.get<{ data: Category[] }>('/categories');
    return response.data.data;
  },

  async getCategoryBySlug(slug: string) {
    const response = await api.get<{ data: Category }>(`/categories/${slug}`);
    return response.data.data;
  },
};
