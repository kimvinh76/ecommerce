import api from "@/lib/axios";

export const statisticsServices = {
  getOverviewStats: async (from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/overview', { params });
    return response.data;
  },

  getRevenueStats: async (period: string = 'month', from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, string> = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/revenue', { params });
    return response.data;
  },

  getProfitStats: async (period: string = 'month', from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, string> = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/profit', { params });
    return response.data;
  },

  getTopProducts: async (limit: number = 10, from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, any> = { limit };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/top-products', { params });
    return response.data;
  },

  getOrderStats: async (): Promise<any> => {
    const response = await api.get('/statistics/orders');
    return response.data;
  },

  getTopCategories: async (limit: number = 5, from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, any> = { limit };
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/top-categories', { params });
    return response.data;
  },

  getPaymentMethodsStats: async (from: string | null = null, to: string | null = null): Promise<any> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/payment-methods', { params });
    return response.data;
  },

  getComparisonStats: async (): Promise<any> => {
    const response = await api.get('/statistics/comparison');
    return response.data;
  },

  getOrderStatusStats: async (from: string = '', to: string = ''): Promise<any> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/statistics/order-status', { params });
    return response.data;
  }
};
