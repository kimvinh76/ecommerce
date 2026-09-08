"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import type { Publisher } from "@/types/publisher.type";
import Pagination from "../components/Pagination";
import { publisherServices } from "@/services/publisherServices";

export default function PublishersPage() {
  const { data: rawPublishers = [], isLoading: loading, mutate: fetchPublishers } = useSWR("/publishers", publisherServices.getAllPublishers);
  
  const publishers: Publisher[] = Array.isArray(rawPublishers) ? rawPublishers : (rawPublishers as any).data || [];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [formData, setFormData] = useState<{ name: string }>({ name: "" });

  // Lọc theo tên
  const filteredPublishers = publishers.filter((pub) =>
    pub.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPublishers.length / itemsPerPage);
  const paginatedPublishers = filteredPublishers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mở modal thêm/sửa
  const openModal = (publisher: Publisher | null = null) => {
    if (publisher) {
      setEditingPublisher(publisher);
      setFormData({ name: publisher.name });
    } else {
      setEditingPublisher(null);
      setFormData({ name: "" });
    }
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "" });
    setEditingPublisher(null);
    setShowModal(false);
  };

  // Lưu form
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng nhập tên nhà xuất bản!',
      });
      return;
    }

    try {
      if (editingPublisher) {
        await publisherServices.updatePublisher(editingPublisher._id, { name: formData.name.trim() });
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Cập nhật nhà xuất bản thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await publisherServices.createPublisher({ name: formData.name.trim() });
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Thêm nhà xuất bản thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      await fetchPublishers();
      resetForm();
    } catch (error) {
      console.error("Error saving publisher:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: (error as any).response?.data?.message || 'Không thể lưu nhà xuất bản',
      });
    }
  };

  // Xóa
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa nhà xuất bản',
      html: `Bạn có chắc muốn xóa "<strong>${name}</strong>"?<br/><small class="text-red-500">⚠️ Hành động này không thể hoàn tác!</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await publisherServices.deletePublisher(id);
        toast.success('Xóa nhà xuất bản thành công!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontSize: '15px',
            padding: '16px',
          },
        });
        await fetchPublishers();
      } catch (error) {
        console.error("Error deleting publisher:", error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: (error as any).response?.data?.message || 'Lỗi khi xóa nhà xuất bản!',
        });
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-l-4 border-teal-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Quản lý nhà xuất bản</h2>
            <p className="text-gray-600 text-sm mt-1">Quản lý thông tin nhà xuất bản</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Thêm nhà xuất bản
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <div className="relative">
              <input
                placeholder="Nhập tên nhà xuất bản cần tìm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 bg-white px-4 py-2.5 pl-10 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">
                    Tên nhà xuất bản
                  </th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold text-sm">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedPublishers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      Không tìm thấy nhà xuất bản nào 🏢
                    </td>
                  </tr>
                ) : (
                  paginatedPublishers.map((pub) => (
                    <tr
                      key={pub._id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="px-4 py-4 text-gray-800 font-medium">
                        {pub.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(pub)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pub._id, pub.name)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPublishers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all animate-slideUp border border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-emerald-600">
              {editingPublisher ? "Sửa nhà xuất bản" : "Thêm nhà xuất bản mới"}
            </h3>
            <div>
              <label className="block text-gray-700 mb-2 font-medium text-sm">
                Tên nhà xuất bản *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Nhập tên nhà xuất bản..."
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
              >
                {editingPublisher ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
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