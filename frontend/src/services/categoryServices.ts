import { Category } from "@/types/category.type";
import api from '@/lib/axios';

export const categoryServices = {
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get<Category[]>('/categories');
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    try {
      const response = await api.get<Category>(`/categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  getCategoryById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get<Category>(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    try {
      const response = await api.post<Category>('/categories', data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    try {
      const response = await api.put<Category>(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteCategory: async (id: string): Promise<any> => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
