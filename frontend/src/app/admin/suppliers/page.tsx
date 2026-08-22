"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import type { Supplier } from "@/types/supplier.type";
import Pagination from "../components/Pagination";
import { supplierServices } from "@/services/supplierServices";

export default function SuppliersPage() {
  const phoneRegex = /^0\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const { data: rawSuppliers = [], isLoading: loading, mutate: fetchSuppliers } = useSWR("/suppliers", () => supplierServices.getAllSuppliers());
  const suppliers: Supplier[] = Array.isArray(rawSuppliers) ? rawSuppliers : (rawSuppliers as any).data || [];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Omit<Supplier, "_id">, string>>>({});
  const [formData, setFormData] = useState<Omit<Supplier, "_id">>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      setFormErrors({});
    }
  }, [formData]);

  // Lọc theo tên hoặc số điện thoại
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mở modal thêm/sửa
  const openModal = (supplier: Supplier | null = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setFormErrors({});
    setEditingSupplier(null);
    setShowModal(false);
  };

  // Submit form
  const handleSubmit = async () => {
    const sanitizedData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    };

    const nextErrors: Partial<Record<keyof Omit<Supplier, "_id">, string>> = {};

    if (!sanitizedData.name) {
      nextErrors.name = "Vui lòng nhập tên nhà cung cấp";
    }
    if (!sanitizedData.phone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!phoneRegex.test(sanitizedData.phone)) {
      nextErrors.phone = "Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số";
    }
    if (!sanitizedData.email) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(sanitizedData.email)) {
      nextErrors.email = "Email không đúng định dạng";
    }
    if (!sanitizedData.address) {
      nextErrors.address = "Vui lòng nhập địa chỉ";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      if (editingSupplier) {
        await supplierServices.updateSupplier(editingSupplier._id, sanitizedData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Cập nhật nhà cung cấp thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await supplierServices.createSupplier(sanitizedData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Thêm nhà cung cấp thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: (error as any).response?.data?.message || 'Không thể lưu nhà cung cấp',
      });
    }
  };

  // Xóa
  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa nhà cung cấp',
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
        await supplierServices.deleteSupplier(id);
        toast.success('Xóa nhà cung cấp thành công!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontSize: '15px',
            padding: '16px',
          },
        });
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: (error as any).response?.data?.message || 'Lỗi khi xóa nhà cung cấp!',
        });
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-l-4 border-teal-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Quản lý nhà cung cấp</h2>
            <p className="text-gray-600 text-sm mt-1">Quản lý thông tin nhà cung cấp sách</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Thêm nhà cung cấp
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Ô tìm kiếm */}
          <div className="mb-6">
            <div className="relative">
              <input
                placeholder="Tìm theo tên hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 bg-white px-4 py-2.5 pl-10 rounded-lg w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Tên nhà cung cấp</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Số điện thoại</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Email</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Địa chỉ</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Không tìm thấy nhà cung cấp nào
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((supplier) => (
                    <tr
                      key={supplier._id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="px-4 py-4 text-gray-800 font-medium">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-4 text-gray-600">{supplier.phone}</td>
                      <td className="px-4 py-4 text-gray-600">{supplier.email}</td>
                      <td className="px-4 py-4 text-gray-600">{supplier.address}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(supplier)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier._id, supplier.name)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200"
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
            totalItems={filteredSuppliers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md transform transition-all animate-slideUp border border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-emerald-600">
              {editingSupplier ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </h3>

            <div className="space-y-4">
              {(
                [
                  ["Tên nhà cung cấp *", "name"],
                  ["Số điện thoại *", "phone"],
                  ["Email *", "email"],
                  ["Địa chỉ *", "address"],
                ] as const
              ).map(([label, field]) => (
                <div key={field}>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">{label}</label>
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={formData[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {formErrors[field] ? (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors[field]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
              >
                {editingSupplier ? "Cập nhật" : "Thêm mới"}
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