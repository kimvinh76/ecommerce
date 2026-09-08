import api from "@/lib/axios";
import { Author } from "@/types/author.type";

export const authorServices = {
  getAllAuthors: async (): Promise<Author[]> => {
      const response = await api.get('/authors');
      return response.data;
  },
  getAuthorById: async (id: string): Promise<Author> => {
      const response = await api.get(`/authors/${id}`);
      return response.data;
  },
  createAuthor: async (data: Partial<Author>): Promise<Author> => {
      const response = await api.post('/authors', data);
      return response.data;
  },
  updateAuthor: async (id: string, data: Partial<Author>): Promise<Author> => {
      const response = await api.put(`/authors/${id}`, data);
      return response.data;
  },
  deleteAuthor: async (id: string): Promise<any> => {
      const response = await api.delete(`/authors/${id}`);
      return response.data;
  }
};