import api from "@/lib/axios";
import { User } from "@/types/user.type"; // Assuming User type exists

export const userServices = {
  getAllUsers: async (): Promise<User[]> => {
      const response = await api.get('/users');
      return response.data;
  },
  getUserById: async (id: string): Promise<User> => {
      const response = await api.get(`/users/${id}`);
      return response.data;
  },
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
  },
  deleteUser: async (id: string): Promise<any> => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
  },
  createUser: async (userData: Partial<User>): Promise<User> => {
      const response = await api.post('/users', userData);
      return response.data;
  },
  lockUser: async (id: string): Promise<User> => {
      const response = await api.put(`/users/${id}/lock`);
      return response.data;
  },
  unlockUser: async (id: string): Promise<User> => {
      const response = await api.put(`/users/${id}/unlock`);
      return response.data;
  }
};
