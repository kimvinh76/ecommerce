"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, Edit2, Trash2, Check, X, Calendar } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import {
  getAllEventsApi,
  createEventApi,
  updateEventApi,
  deleteEventApi,
  updateEventStatusApi,
  EventStatus,
} from "@/services/EventApi";
import { bookServices } from "@/services/bookServices";
import { categoryServices } from "@/services/categoryServices";
import { Book } from "@/types/book.type";
import { Category } from "@/types/category.type";
import Pagination from "../components/Pagination";

interface Event {
  _id: string;
  name: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "upcoming";
  applyType: "all" | "products" | "categories";
  bookIds?: string[];
  categoryIds?: string[];
}

export default function EventsPage() {
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
  });
  
  const { data: eventsData, mutate: fetchEvents, isLoading: loading } = useSWR(
    ["/events", pagination.currentPage, pagination.limit],
    () => getAllEventsApi(pagination.currentPage, pagination.limit)
  );
  
  const events: Event[] = eventsData?.events || [];
  const totalPages = Math.max(1, eventsData?.totalPages || 1);
  const totalItems = eventsData?.totalItems || 0;

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    applyType: "all" as "all" | "products" | "categories",
    bookIds: [] as string[],
    categoryIds: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
    if (Object.keys(formErrors).length > 0) {
      setFormErrors({});
    }
  }, [formData]);

  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      const response = await bookServices.getBooks(1, 1000, "");
      setBooks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      toast.error("Lỗi tải danh sách sách");
    } finally {
      setBooksLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryServices.getAllCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Lỗi tải danh sách danh mục");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên sự kiện";
    }

    if (!formData.startDate) {
      nextErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }

    if (!formData.endDate) {
      nextErrors.endDate = "Vui lòng chọn ngày kết thúc";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        nextErrors.dateRange = "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ";
      } else if (end < start) {
        nextErrors.dateRange = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu";
      }
    }

    if (!Number.isFinite(formData.discountPercent)) {
      nextErrors.discountPercent = "Phần trăm giảm giá không hợp lệ";
    } else if (formData.discountPercent <= 0 || formData.discountPercent > 100) {
      nextErrors.discountPercent = "Phần trăm giảm giá phải từ 1 đến 100";
    }

    if (formData.applyType === "products" && formData.bookIds.length === 0) {
      nextErrors.bookIds = "Vui lòng chọn ít nhất 1 sản phẩm";
    }

    if (
      formData.applyType === "categories" &&
      formData.categoryIds.length === 0
    ) {
      nextErrors.categoryIds = "Vui lòng chọn ít nhất 1 danh mục";
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      const firstError =
        nextErrors.name ||
        nextErrors.discountPercent ||
        nextErrors.startDate ||
        nextErrors.endDate ||
        nextErrors.dateRange ||
        nextErrors.bookIds ||
        nextErrors.categoryIds ||
        "Vui lòng kiểm tra lại thông tin";
      setFormError(firstError);
      toast.error(firstError);
      return;
    }

    try {
      if (editingEvent) {
        await updateEventApi(editingEvent._id, formData);
        toast.success("Cập nhật sự kiện thành công");
      } else {
        await createEventApi(formData);
        toast.success("Thêm sự kiện thành công");
      }

      fetchEvents();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Xóa sự kiện",
      text: "Bạn có chắc muốn xóa sự kiện này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await deleteEventApi(id);
        toast.success("Xóa sự kiện thành công");
        fetchEvents();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi");
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormError(null);
    setFormErrors({});
    setFormData({
      name: event.name,
      description: event.description || "",
      discountPercent: event.discountPercent,
      startDate: event.startDate.split("T")[0],
      endDate: event.endDate.split("T")[0],
      applyType: event.applyType,
      bookIds: event.bookIds || [],
      categoryIds: event.categoryIds || [],
    });
    fetchBooks();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormError(null);
    setFormErrors({});
    setFormData({
      name: "",
      description: "",
      discountPercent: 0,
      startDate: "",
      endDate: "",
      applyType: "all",
      bookIds: [],
      categoryIds: [],
    });
    setShowModal(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const isEventExpired = (event: Event) => {
    const now = new Date();
    const end = new Date(event.endDate);
    return now > end;
  };

  const getAutoStatusByDate = (event: Event): EventStatus => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (event.status === "inactive") return "inactive";
    if (now >= start && now <= end) return "active";
    return "upcoming";
  };

  const getDisplayStatus = (event: Event) => {
    if (isEventExpired(event)) return "expired" as const;
    return getAutoStatusByDate(event);
  };

  const getStatusLabel = (status: EventStatus | "expired") => {
    switch (status) {
      case "active":
        return "Đang diễn ra";
      case "upcoming":
        return "Sắp tới";
      case "inactive":
        return "Không hoạt động";
      default:
        return "Đã hết hạn";
    }
  };

  const isAdminEnabled = (event: Event) => event.status !== "inactive";

  const handleStatusChange = async (
    eventId: string,
    currentStatus: EventStatus,
    nextStatus: "active" | "inactive"
  ) => {
    if (currentStatus === nextStatus) return;

    try {
      setStatusUpdatingId(eventId);
      await updateEventStatusApi(eventId, nextStatus);

      fetchEvents();

      toast.success("Cập nhật trạng thái thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-l-4 border-purple-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">
              Quản lý Sự kiện Giảm giá
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Tạo và quản lý các sự kiện giảm giá cho sách
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              fetchBooks();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm sự kiện
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Đang tải sự kiện...
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có sự kiện nào
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Tên sự kiện
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Áp dụng
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Kết thúc
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold w-[220px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-800">
                        {event.name}
                      </div>
                      {event.description && (
                        <div className="text-sm text-gray-500">
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                        -{event.discountPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {event.applyType === "all" ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          Toàn bộ
                        </span>
                      ) : event.applyType === "products" ? (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {event.bookIds?.length || 0} sản phẩm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {event.categoryIds?.length || 0} danh mục
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-6 py-3">{formatDate(event.endDate)}</td>
                    <td className="px-6 py-3 w-[220px] align-top">
                      <div className="space-y-2">
                        {getDisplayStatus(event) === "active" ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            <Check className="w-4 h-4" /> {getStatusLabel(getDisplayStatus(event))}
                          </span>
                        ) : getDisplayStatus(event) === "upcoming" ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            <Calendar className="w-4 h-4" /> {getStatusLabel(getDisplayStatus(event))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                            <X className="w-4 h-4" /> {getStatusLabel(getDisplayStatus(event))}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAdminEnabled(event)}
                            disabled={isEventExpired(event) || statusUpdatingId === event._id}
                            onClick={() =>
                              handleStatusChange(
                                event._id,
                                event.status,
                                isAdminEnabled(event) ? "inactive" : "active"
                              )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isAdminEnabled(event) ? "bg-emerald-500" : "bg-gray-300"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                isAdminEnabled(event) ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-600">
                            {isAdminEnabled(event)
                              ? " Cho hoạt động"
                              : "Tắt"}
                          </span>
                        </div>

               
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            <div className="px-6 pb-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={pagination.limit}
                onPageChange={(page) =>
                  setPagination((prev) => ({ ...prev, currentPage: page }))
                }
                onItemsPerPageChange={(items) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit: items,
                    currentPage: 1,
                  }))
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/25 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingEvent ? "Sửa sự kiện" : "Thêm sự kiện mới"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sự kiện *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="VD: Black Friday 2024"
                />
                {formErrors.name ? (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  placeholder="Mô tả sự kiện..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phần trăm giảm giá (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="30"
                />
                {formErrors.discountPercent ? (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.discountPercent}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Áp dụng cho *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyType"
                      value="all"
                      checked={formData.applyType === "all"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applyType: e.target.value as "all" | "products" | "categories",
                          bookIds: [],
                          categoryIds: [],
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Áp dụng toàn bộ sách</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyType"
                      value="products"
                      checked={formData.applyType === "products"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applyType: e.target.value as "all" | "products" | "categories",
                          categoryIds: [],
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Áp dụng với sản phẩm nhất định</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applyType"
                      value="categories"
                      checked={formData.applyType === "categories"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applyType: e.target.value as "all" | "products" | "categories",
                          bookIds: [],
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Áp dụng cho danh mục sách</span>
                  </label>
                </div>
              </div>

              {formData.applyType === "products" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn sản phẩm *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {booksLoading ? (
                      <div className="text-center text-gray-500 text-sm py-2">
                        Đang tải sách...
                      </div>
                    ) : books.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-2">
                        Không có sách nào
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {books.map((book) => (
                          <label
                            key={book._id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.bookIds.includes(book._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    bookIds: [...formData.bookIds, book._id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    bookIds: formData.bookIds.filter(
                                      (id) => id !== book._id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">
                              {book.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.bookIds.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      Đã chọn {formData.bookIds.length} sản phẩm
                    </p>
                  )}
                  {formErrors.bookIds ? (
                    <p className="text-sm text-red-600 mt-2">
                      {formErrors.bookIds}
                    </p>
                  ) : null}
                </div>
              )}

              {formData.applyType === "categories" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn danh mục *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {categoriesLoading ? (
                      <div className="text-center text-gray-500 text-sm py-2">
                        Đang tải danh mục...
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-2">
                        Không có danh mục nào
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <label
                            key={category._id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.categoryIds.includes(
                                category._id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    categoryIds: [
                                      ...formData.categoryIds,
                                      category._id,
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    categoryIds: formData.categoryIds.filter(
                                      (id) => id !== category._id
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.categoryIds.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      Đã chọn {formData.categoryIds.length} danh mục
                    </p>
                  )}
                  {formErrors.categoryIds ? (
                    <p className="text-sm text-red-600 mt-2">
                      {formErrors.categoryIds}
                    </p>
                  ) : null}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  max={formData.endDate || undefined}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {formErrors.startDate ? (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.startDate}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate || undefined}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {formErrors.endDate ? (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.endDate}
                  </p>
                ) : null}
              </div>
              {formErrors.dateRange ? (
                <p className="text-sm text-red-600">{formErrors.dateRange}</p>
              ) : null}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                {editingEvent ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
