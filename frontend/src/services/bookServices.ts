import { Book, BookDetail } from "@/types/book.type";
import { ApiResponse } from "@/types/response.type";
import api from '@/lib/axios';

export const bookServices = {
  getBooks: async (
    page: number = 1,
    limit: number = 12,
    categoryId: string,
    publishers?: string[],
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    sortBy?: string,
    eventId?: string
  ): Promise<ApiResponse<Book[]>> => {
    try {
      const queryParams: Record<string, any> = {
        page,
        limit,
        categoryId,
      };

      if (search?.trim()) queryParams.search = search.trim();
      if (minPrice !== undefined && minPrice >= 0)
        queryParams.minPrice = minPrice;
      if (maxPrice !== undefined && maxPrice >= 0)
        queryParams.maxPrice = maxPrice;
      if (sortBy) queryParams.sortBy = sortBy;
      if (eventId?.trim()) queryParams.event = eventId.trim();
      if (publishers && publishers.length > 0) {
        queryParams.publishers = publishers.join(",");
      }

      const response = await api.get<ApiResponse<Book[]>>(
        `/books`,
        {
          params: queryParams,
        }
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getMaxPrice: async (): Promise<number> => {
    try {
      const response = await api.get<number>("/books/max-price");
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getBookById: async (productId: string): Promise<BookDetail> => {
    try {
      const response = await api.get<BookDetail>(`/books/${productId}`);
      return response.data;
    } catch (error: any) {
      // Check if product was deleted (404) or doesn't exist (400)
      if (error.response?.status === 404 || error.response?.status === 400) {
        const errorWithStatus = new Error(`Sản phẩm không tồn tại`) as any;
        errorWithStatus.status = error.response?.status;
        errorWithStatus.productId = productId;
        throw errorWithStatus;
      }
      console.error(error);
      throw error;
    }
  },
  getAllBooks: async (params: any = {}): Promise<any> => {
    try {
      const response = await api.get('/books', { params });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  createBook: async (formData: FormData): Promise<any> => {
    try {
      const response = await api.post('/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateBook: async (id: string, formData: FormData): Promise<any> => {
    try {
      const response = await api.put(`/books/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteBook: async (id: string): Promise<any> => {
    try {
      const response = await api.delete(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};


