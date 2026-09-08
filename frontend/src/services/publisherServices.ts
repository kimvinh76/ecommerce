import api from "@/lib/axios";
import { Publisher } from "@/types/publisher.type";

export const publisherServices = {
  getAllPublishers: async (): Promise<Publisher[]> => {
    try {
      const response = await api.get<Publisher[]>("/publishers");
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  getPublisherById: async (id: string): Promise<Publisher> => {
    try {
      const response = await api.get<Publisher>(`/publishers/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  createPublisher: async (data: Partial<Publisher>): Promise<Publisher> => {
    try {
      const response = await api.post<Publisher>('/publishers', data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updatePublisher: async (id: string, data: Partial<Publisher>): Promise<Publisher> => {
    try {
      const response = await api.put<Publisher>(`/publishers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deletePublisher: async (id: string): Promise<any> => {
    try {
      const response = await api.delete(`/publishers/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
