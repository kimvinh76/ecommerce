import { ApiResponse } from "@/types/response.type";
import api from "@/lib/axios";

export interface SupplyReceipt {
  _id: string;
  supplier_id: string;
  admin_id: string;
  supply_date: string;
  supply_status: "pending" | "completed" | "cancelled";
  items: SupplyItem[];
  total_amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyItem {
  book_id: string;
  import_price: number;
  quantity: number;
  sub_amount: number;
}

export const supplyReceiptServices = {
  // Get all supply receipts
  getAllSupplyReceipts: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ): Promise<ApiResponse<SupplyReceipt[]>> => {
    try {
      const params: Record<string, any> = { page, limit };
      if (status && status !== "all") {
        params.status = status;
      }
      if (search) {
        params.search = search;
      }

      const response = await api.get<ApiResponse<SupplyReceipt[]>>(
        "/supply-receipts",
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching supply receipts:", error);
      throw error;
    }
  },

  // Get single supply receipt
  getSupplyReceiptById: async (id: string): Promise<ApiResponse<SupplyReceipt>> => {
    try {
      const response = await api.get<ApiResponse<SupplyReceipt>>(
        `/supply-receipts/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching supply receipt:", error);
      throw error;
    }
  },

  // Create supply receipt
  createSupplyReceipt: async (data: Omit<SupplyReceipt, "_id" | "createdAt" | "updatedAt" | "total_amount">): Promise<ApiResponse<SupplyReceipt>> => {
    try {
      const response = await api.post<ApiResponse<SupplyReceipt>>(
        "/supply-receipts",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating supply receipt:", error);
      throw error;
    }
  },

  // Update supply receipt
  updateSupplyReceipt: async (
    id: string,
    data: Partial<Omit<SupplyReceipt, "_id" | "createdAt" | "updatedAt" | "total_amount">>
  ): Promise<ApiResponse<SupplyReceipt>> => {
    try {
      const response = await api.put<ApiResponse<SupplyReceipt>>(
        `/supply-receipts/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating supply receipt:", error);
      throw error;
    }
  },
  // Update supply receipt status only
  updateSupplyReceiptStatus: async (id: string, purchaseStatus: string): Promise<ApiResponse<SupplyReceipt>> => {
    try {
      const response = await api.patch<ApiResponse<SupplyReceipt>>(
        `/supply-receipts/${id}/status`,
        { purchaseStatus }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating supply receipt status:", error);
      throw error;
    }
  },

  // Get supply receipt statistics
  getSupplyReceiptStats: async (): Promise<any> => {
    try {
      const response = await api.get('/supply-receipts/stats');
      return response.data;
    } catch (error) {
      console.error("Error fetching supply receipt stats:", error);
      throw error;
    }
  },
};
