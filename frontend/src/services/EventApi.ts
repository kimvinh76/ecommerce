import api from "@/lib/axios";

export type EventStatus = "active" | "inactive" | "upcoming";

interface EventListPayload {
  events?: any[];
  totalEvents?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface EventListResponse {
  events: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export async function getAllEventsApi(
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<EventListResponse> {
  try {
    const response = await api.get(`/events`, {
      params: { page, limit, search },
    });

    const payload: EventListPayload = response.data?.data || {};

    return {
      events: payload.events || [],
      totalItems: payload.totalEvents || 0,
      totalPages: payload.totalPages || 1,
      currentPage: payload.currentPage || page,
      limit,
    };
  } catch (error) {
    throw error;
  }
}

export async function getActiveEventsApi() {
  try {
    const response = await api.get(`/events/active`);
   return response.data?.data || [];
  } catch (error) {
    throw error;
  }
}

export async function getEventByIdApi(eventId: string) {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data?.data || null;
  } catch (error) {
    throw error;
  }
}

export async function createEventApi(data: {
  name: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  applyType: string;
  bookIds?: string[];
  categoryIds?: string[];
}) {
  try {
    const response = await api.post(`/events`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateEventApi(eventId: string, data: any) {
  try {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteEventApi(eventId: string) {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function addBooksToEventApi(eventId: string, bookIds: string[]) {
  try {
    const response = await api.post(
      `/events/${eventId}/add-books`,
      { bookIds }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function removeBookFromEventApi(
  eventId: string,
  bookId: string
) {
  try {
    const response = await api.delete(
      `/events/${eventId}/remove-book/${bookId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateEventStatusApi(
  eventId: string,
  status: EventStatus
) {
  try {
    const response = await api.put(`/events/${eventId}/status`, { status });
    return response.data?.data;
  } catch (error) {
    throw error;
  }
}
