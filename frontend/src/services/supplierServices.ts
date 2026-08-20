import api from "@/lib/axios";
import { Supplier } from "@/types/supplier.type"; // Assuming Supplier type exists, if not use any

export const supplierServices = {
  getAllSuppliers: async (): Promise<Supplier[]> => {
      const response = await api.get('/suppliers');
      return response.data;
  },
  getSupplierById: async (id: string): Promise<Supplier> => {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
  },
  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
      const response = await api.post('/suppliers', data);
      return response.data;
  },
  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
  },
  deleteSupplier: async (id: string): Promise<any> => {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
  }
};
