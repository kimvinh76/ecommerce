"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import Pagination from "../components/Pagination";
import type { User } from "@/types/user.type";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { userServices } from "@/services/userServices";
import { useUser } from '@/services/authservices';

export default function UsersPage() {
  const { data: rawUsers = [], isLoading: loading, mutate: fetchUsers } = useSWR("/users", userServices.getAllUsers);
  
  // API could return { data: [...] } or direct array
  const users: User[] = Array.isArray(rawUsers) ? rawUsers : (rawUsers as any).data || [];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const { user } = useUser();
  const [phoneError, setPhoneError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Email kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng (v\u00ed d\u1ee5: example@gmail.com)");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Phone validation (Vietnam phone number format)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0\d{9}$/;
    if (!phone) {
      setPhoneError("S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng");
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setPhoneError("S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng (v\u00ed d\u1ee5: 0912345678)");
      return false;
    }
    setPhoneError("");
    return true;
  };


  // Lọc user
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      (user?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user?.username?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Submit form
  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.username ||
      !formData.email ||
      !formData.phone
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng điền đầy đủ thông tin!',
      });
      return;
    }

    // Validate email and phone
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.phone);

    if (!isEmailValid || !isPhoneValid) {
      return;
    }

    // When creating, password is required
    if (!editingUser && !formData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng nhập mật khẩu!',
      });
      return;
    }

    // Validate password length when provided
    if (formData.password && formData.password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      if (editingUser) {
        // Update user - gửi role vì admin có quyền thay đổi
        const updateData = {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          ...(formData.password && { password: formData.password }) // Only include password if provided
        };
        await userServices.updateUser(editingUser._id, updateData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Cập nhật người dùng thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // Create new user
        await userServices.createUser(formData);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Thêm người dùng thành công!',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: (error as any).response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng!',
      });
    }
  };

  const handleDelete = async (id: string, username: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa người dùng',
      html: `Bạn có chắc muốn xóa "<strong>${username}</strong>"?<br/><small class="text-red-500">⚠️ Hành động này không thể hoàn tác!</small>`,
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
        await userServices.deleteUser(id);
        toast.success('Xóa người dùng thành công!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontSize: '15px',
            padding: '16px',
          },
        });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: (error as any).response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng!',
        });
      }
    }
  };

  const handleLockUser = async (id: string, username: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận khóa người dùng',
      html: `Bạn có chắc muốn khóa tài khoản "<strong>${username}</strong>"?<br/><small class="text-yellow-600">⚠️ Người dùng sẽ không thể đăng nhập</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Khóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await userServices.lockUser(id);
        toast.success('Khóa người dùng thành công!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontSize: '15px',
            padding: '16px',
          },
        });
        fetchUsers();
      } catch (error) {
        console.error("Error locking user:", error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: (error as any).response?.data?.message || 'Có lỗi xảy ra khi khóa người dùng!',
        });
      }
    }
  };

  const handleUnlockUser = async (id: string, username: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận mở khóa người dùng',
      html: `Bạn có chắc muốn mở khóa tài khoản "<strong>${username}</strong>"?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Mở khóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await userServices.unlockUser(id);
        toast.success('Mở khóa người dùng thành công!', {
          position: 'bottom-right',
          duration: 3000,
          style: {
            fontSize: '15px',
            padding: '16px',
          },
        });
        fetchUsers();
      } catch (error) {
        console.error("Error unlocking user:", error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: (error as any).response?.data?.message || 'Có lỗi xảy ra khi mở khóa người dùng!',
        });
      }
    }
  };

  const openModal = (user: User | null = null) => {
    // Reset validation errors
    setEmailError("");
    setPhoneError("");
    setPasswordError("");

    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: "", // Don't populate password when editing
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "user",
      });
    }
    setShowFormPassword(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setShowFormPassword(false);
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setFormData({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "user",
    });
    setShowModal(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-l-4 border-teal-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Quản lý người dùng</h2>
            <p className="text-gray-600 text-sm mt-1">Quản lý thông tin tài khoản người dùng</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              placeholder="Tìm theo tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Họ tên</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Username</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Email</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Số điện thoại</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Vai trò</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Trạng thái</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Không tìm thấy người dùng nào 👥
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user._id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                      <td className="px-4 py-4 text-gray-800 font-medium">{user.fullName}</td>
                      <td className="px-4 py-4 text-gray-600">{user.username}</td>
                      <td className="px-4 py-4 text-gray-600">{user.email}</td>
                      <td className="px-4 py-4 text-gray-600">{user.phone}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${user.isActive
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                          {user.isActive ? "✓ Hoạt động" : "✗ Bị khóa"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(user)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200 tooltip" title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {user.role === "user" && (
                            <>
                              {user.isActive ? (
                                <button
                                  onClick={() => handleLockUser(user._id, user.username)}
                                  className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all duration-200 tooltip" title="Khóa"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnlockUser(user._id, user.username)}
                                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 tooltip" title="Mở khóa"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {user.role === "admin" && (
                            <div className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed" title="Không thể khóa tài khoản admin">
                              <Lock className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(user._id, user.username)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 tooltip" title="Xóa"
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

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
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
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.3)] transform transition-all animate-slideUp">
            <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-emerald-600">
              {editingUser ? "Sửa người dùng" : "Thêm người dùng mới"}
            </h3>

            <div className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Họ tên *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailError("");
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  className={`w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${emailError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-emerald-500'
                    }`}
                  placeholder="example@gmail.com"
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>⚠️</span> {emailError}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Số điện thoại *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setPhoneError("");
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  className={`w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${phoneError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-emerald-500'
                    }`}
                  placeholder="0912345678"
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>⚠️</span> {phoneError}
                  </p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Mật khẩu *</label>
                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordError("");
                    }}
                    className={`w-full border px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12 ${passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition"
                  >
                    {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm">Vai trò *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "user" | "admin" })
                  }
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  {editingUser ? "Cập nhật" : "Thêm mới"}
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
        </div>
      )}
    </div>
  );
}