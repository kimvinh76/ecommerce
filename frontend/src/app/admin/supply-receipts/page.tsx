"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Eye } from "lucide-react";
import Swal from "sweetalert2";
import { supplyReceiptServices } from "@/services/supplyReceiptServices";
import { supplierServices } from "@/services/supplierServices";
import { bookServices } from "@/services/bookServices";
import SearchableSelect from "@/components/SearchableSelect";
import type { SupplyReceipt, SupplyItem } from "@/types/supplyreceipt.type";
import type { Supplier } from "@/types/supplier.type";
import type { Book } from "@/types/book.type";
import Pagination from "../components/Pagination";

export default function SupplyReceiptsPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplyReceipt | null>(null);

  // --- SWR Hooks ---
  const { data: rawSuppliers = [] } = useSWR("/suppliers", supplierServices.getAllSuppliers);
  const suppliers: Supplier[] = (rawSuppliers as any).data || rawSuppliers || [];
  const mappedSuppliers = suppliers.map((s: any) => ({ id: s._id || s.id, name: s.name, phone: s.phone, email: s.email, address: s.address }));

  const { data: rawBooks = [] } = useSWR("/books?limit=1000", () => bookServices.getAllBooks({ limit: 1000 }));
  const books: Book[] = (rawBooks as any).data || rawBooks || [];
  const mappedBooks = books.map((b: any) => ({ id: b._id || b.id, name: b.name, price: b.price }));

  const fetchParams: any = { page: currentPage, limit: itemsPerPage };
  if (statusFilter !== "all") fetchParams.status = statusFilter;
  
  const { data: receiptsResponse, mutate: fetchReceipts, isLoading: loading } = useSWR(
    ["/supply-receipts", fetchParams],
    () => supplyReceiptServices.getAllSupplyReceipts(fetchParams)
  );

  const { data: allReceiptsResponse } = useSWR(
    "/supply-receipts/all",
    () => supplyReceiptServices.getAllSupplyReceipts({ page: 1, limit: 1000 })
  );

  const receiptsData = receiptsResponse?.data || [];
  const allReceipts = allReceiptsResponse?.data || [];

  const receipts: SupplyReceipt[] = receiptsData.map((r: any) => ({
    id: r._id,
    supplier_id: r.supplierId?._id || r.supplierId,
    supplier_name: r.supplierId?.name || "Không rõ",
    admin_id: r.adminId?._id || r.adminId,
    supply_date: r.supplyDate,
    supply_status: r.purchaseStatus,
    total_amount: r.totalAmount || 0,
    items: (r.details || []).map((d: any) => ({
      book_id: d.bookId?._id || d.bookId,
      book_name: d.bookId?.name || "Không rõ",
      import_price: d.importPrice,
      quantity: d.quantity,
      sub_amount: d.importPrice * d.quantity,
    })),
  }));

  const totalItems = receiptsResponse?.pagination?.total || receipts.length;
  
  const statusCounts = {
    all: allReceipts.length,
    pending: allReceipts.filter((r: any) => r.purchaseStatus === "pending").length,
    completed: allReceipts.filter((r: any) => r.purchaseStatus === "completed").length,
    canceled: allReceipts.filter((r: any) => r.purchaseStatus === "canceled").length,
  };
  const [formErrors, setFormErrors] = useState<{
    supplier_id?: string;
    supply_date?: string;
    items?: string;
    itemErrors?: Array<{ book_id?: string; quantity?: string; import_price?: string }>;
  }>({});



  // Pagination đã được xử lý từ API
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isEditableStatus = (status?: string) => status === "pending";
  const canUpdateStatus = (status?: string) => status === "pending";
  const isReadonlyEdit = Boolean(editing && !isEditableStatus(editing.supply_status));

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReceipt, setStatusReceipt] = useState<SupplyReceipt | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusAction, setStatusAction] = useState<"completed" | "canceled" | "">("");

  const [formData, setFormData] = useState<Omit<SupplyReceipt, "id" | "total_amount">>({
    supplier_id: "",
    admin_id: "",
    supply_date: new Date().toISOString().slice(0, 10),
    supply_status: "pending",
    items: [],
  });

  if (Object.keys(formErrors).length > 0) {
    // using clear trick instead of useEffect, wait, let's just clear manually in resetForm/openModal
  }

  // Tính tổng tiền
  const calcTotal = (items: SupplyItem[]) =>
    items.reduce((sum, i) => sum + i.import_price * i.quantity, 0);

  // Mở modal
  const openModal = (receipt: SupplyReceipt | null = null) => {
    if (receipt) {
      setEditing(receipt);
      setFormData({
        supplier_id: receipt.supplier_id,
        admin_id: receipt.admin_id,
        supply_date: receipt.supply_date.slice(0, 10),
        // Form chi tiet khong cap nhat status, chi hien thong tin nhap hang.
        supply_status: receipt.supply_status,
        items: receipt.items,
      });
    } else {
      setEditing(null);
      setFormData({
        supplier_id: "",
        admin_id: "u1",
        supply_date: new Date().toISOString().slice(0, 10),
        // Tao moi luon mac dinh pending.
        supply_status: "pending",
        items: [],
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      supplier_id: "",
      admin_id: "u1",
      supply_date: new Date().toISOString().slice(0, 10),
      supply_status: "pending",
      items: [],
    });
    setFormErrors({});
    setShowModal(false);
  };

  // Thêm dòng sản phẩm
  const addItem = () => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { book_id: "", book_name: "", import_price: 1000, quantity: 1, sub_amount: 1000 }],
    });
  };

  // Cập nhật dòng
  const updateItem = (index: number, field: keyof SupplyItem, value: any) => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    const newItems = [...formData.items];
    const updatedItem = { ...newItems[index], [field]: value };
    if (field === "book_id") {
      const selectedBook = mappedBooks.find((b: any) => b.id === value);
      updatedItem.book_name = selectedBook?.name || updatedItem.book_name || "";
    }
    updatedItem.sub_amount = updatedItem.import_price * updatedItem.quantity;
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  // Xóa dòng sản phẩm
  const removeItem = (index: number) => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // Lưu phiếu nhập
  const handleSubmit = async () => {
    if (editing && !isEditableStatus(editing.supply_status)) {
      return;
    }

    const nextErrors: typeof formErrors = {};

    if (!formData.supplier_id) {
      nextErrors.supplier_id = "Vui lòng chọn nhà cung cấp";
    }

    if (!formData.supply_date) {
      nextErrors.supply_date = "Vui lòng chọn ngày nhập";
    } else if (Number.isNaN(new Date(formData.supply_date).getTime())) {
      nextErrors.supply_date = "Ngày nhập không hợp lệ";
    }

    if (formData.items.length === 0) {
      nextErrors.items = "Vui lòng thêm ít nhất 1 sản phẩm";
    }

    if (formData.items.length > 0) {
      nextErrors.itemErrors = formData.items.map((item) => {
        const itemError: { book_id?: string; quantity?: string; import_price?: string } = {};
        if (!item.book_id) {
          itemError.book_id = "Vui lòng chọn sách";
        }
        if (!item.quantity || item.quantity <= 0) {
          itemError.quantity = "Số lượng phải lớn hơn 0";
        }
        if (!item.import_price || item.import_price <= 0) {
          itemError.import_price = "Giá nhập phải lớn hơn 0";
        }
        return itemError;
      });
    }

    const hasItemErrors = Boolean(
      nextErrors.itemErrors?.some((err) => Object.keys(err).length > 0),
    );

    if (nextErrors.supplier_id || nextErrors.items || hasItemErrors) {
      setFormErrors(nextErrors);
      return;
    }

    try {
      // Map dữ liệu sang format backend
      const formattedData: any = {
        supplierId: formData.supplier_id,
        supplyDate: formData.supply_date,
        details: formData.items.map((item) => ({
          bookId: item.book_id,
          importPrice: item.import_price,
          quantity: item.quantity,
        })),
      };

      // Khong gui purchaseStatus khi tao/sua chi tiet, backend se mac dinh pending luc tao.

      console.log("Sending data:", formattedData); // Debug

      if (editing) {
        await supplyReceiptServices.updateSupplyReceipt(editing.id, formattedData);
      } else {
        await supplyReceiptServices.createSupplyReceipt(formattedData);
      }

      resetForm();
      fetchReceipts();
    } catch (error: any) {
      console.error("Error saving receipt:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error?.response?.data?.message || "Có lỗi xảy ra khi lưu phiếu nhập!",
      });
    }
  };

  const openStatusUpdateModal = (
    receipt: SupplyReceipt,
    action: "completed" | "canceled",
  ) => {
    if (receipt.supply_status !== "pending") {
      Swal.fire({
        icon: "info",
        title: "Không thể cập nhật",
        text: "Chỉ có thể cập nhật khi phiếu đang ở trạng thái chờ xử lý.",
      });
      return;
    }
    setStatusReceipt(receipt);
    setNewStatus(action);
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const submitStatusUpdate = async () => {
    if (!statusReceipt || !newStatus) return;

    try {
      await supplyReceiptServices.updateSupplyReceiptStatus(statusReceipt.id, newStatus);

      if (editing?.id === statusReceipt.id) {
        setEditing((prev) => (prev ? { ...prev, supply_status: newStatus as SupplyReceipt["supply_status"] } : prev));
        setFormData((prev) => ({ ...prev, supply_status: newStatus as SupplyReceipt["supply_status"] }));
      }

      await fetchReceipts();
      setShowStatusModal(false);
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text:
          newStatus === "completed"
            ? "Đã xác nhận phiếu và cộng tồn kho thành công."
            : "Đã hủy phiếu nhập thành công.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error?.response?.data?.message || "Không thể cập nhật trạng thái phiếu nhập!",
      });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-l-4 border-teal-600 px-6 py-5 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Quản lý phiếu nhập hàng</h2>
            <p className="text-gray-600 text-sm mt-1">Quản lý thông tin nhập hàng từ nhà cung cấp</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Thêm phiếu nhập
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "all"
                ? "bg-teal-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            Tất cả <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.all}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              }`}
          >
            Đang xử lý <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.pending}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "completed"
                ? "bg-teal-500 text-white shadow-md"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
              }`}
          >
            Đã xác nhận <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.completed}</span>
          </button>
          <button
            onClick={() => { setStatusFilter("canceled"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${statusFilter === "canceled"
                ? "bg-red-500 text-white shadow-md"
                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              }`}
          >
            Đã hủy <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">{statusCounts.canceled}</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Mã phiếu</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Nhà cung cấp</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Ngày nhập</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold text-sm">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-gray-700 font-semibold text-sm">Tổng tiền</th>
                  <th className="px-4 py-3 text-center text-gray-700 font-semibold text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang tải...
                      </div>
                    </td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Chưa có phiếu nhập nào 
                    </td>
                  </tr>
                ) : (
                  receipts.map((r: SupplyReceipt) => {
                    const supplierName = (r as any).supplier_name || mappedSuppliers.find((s: any) => s.id === r.supplier_id)?.name || "Không rõ";
                    return (
                      <tr key={r.id} className="border-t border-gray-200 hover:bg-gray-50 transition-all duration-200">
                        <td className="px-4 py-4 text-gray-800 font-medium">{r.id.slice(-8)}</td>
                        <td className="px-4 py-4 text-gray-600">{supplierName}</td>
                        <td className="px-4 py-4 text-gray-600">
                          {new Date(r.supply_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${r.supply_status === "completed"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : r.supply_status === "canceled"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {r.supply_status === "completed"
                              ? "Đã xác nhận"
                              : r.supply_status === "canceled"
                                ? "Đã hủy"
                                : "Đang xử lý"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-800 font-semibold">
                          {r.total_amount.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openModal(r)}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200"
                              title={!isEditableStatus(r.supply_status) ? "Xem thông tin phiếu" : "Sửa phiếu"}
                            >
                              {!isEditableStatus(r.supply_status) ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <Pencil className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openStatusUpdateModal(r, "completed")}
                              disabled={!canUpdateStatus(r.supply_status)}
                              title="Xác nhận"
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                !canUpdateStatus(r.supply_status)
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              }`}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusUpdateModal(r, "canceled")}
                              disabled={!canUpdateStatus(r.supply_status)}
                              title="Hủy"
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                !canUpdateStatus(r.supply_status)
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
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
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-emerald-600">
              {editing ? (isReadonlyEdit ? "Xem thông tin phiếu nhập" : "Sửa phiếu nhập") : "Thêm phiếu nhập mới"}
            </h3>

            {/* Nhà cung cấp */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Nhà cung cấp *</label>
              <SearchableSelect
                value={formData.supplier_id}
                onChange={(value: string) => {
                  if (isReadonlyEdit) return;
                  setFormData({ ...formData, supplier_id: value });
                }}
                options={mappedSuppliers.map((s: any) => ({ _id: s.id, name: s.name }))}
                placeholder="Chọn nhà cung cấp"
                disabled={isReadonlyEdit}
              />
              {formErrors.supplier_id ? (
                <p className="text-sm text-red-600 mt-1">{formErrors.supplier_id}</p>
              ) : null}
            </div>

            {/* Ngày nhập */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Ngày nhập *</label>
              <input
                type="date"
                value={formData.supply_date}
                onChange={(e) =>
                  setFormData({ ...formData, supply_date: e.target.value })
                }
                disabled={isReadonlyEdit}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {formErrors.supply_date ? (
                <p className="text-sm text-red-600 mt-1">
                  {formErrors.supply_date}
                </p>
              ) : null}
            </div>

            {/* Sản phẩm */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm">Chi tiết sản phẩm *</label>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">Sách</label>
                      {isReadonlyEdit ? (
                        <div className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700">
                          {item.book_name || "Sách đã xóa"}
                        </div>
                      ) : (
                        <SearchableSelect
                          value={item.book_id}
                          onChange={(value: string) =>
                            updateItem(index, "book_id", value)
                          }
                          options={mappedBooks.map((b: any) => ({ _id: b.id, name: b.name }))}
                          placeholder="Chọn sách"
                          disabled={isReadonlyEdit}
                        />
                      )}
                      {formErrors.itemErrors?.[index]?.book_id ? (
                        <p className="text-sm text-red-600 mt-1">
                          {formErrors.itemErrors[index].book_id}
                        </p>
                      ) : null}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value) || 0)
                        }
                        onFocus={(e) => e.target.select()}
                        disabled={isReadonlyEdit}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nhập SL"
                      />
                      {formErrors.itemErrors?.[index]?.quantity ? (
                        <p className="text-sm text-red-600 mt-1">
                          {formErrors.itemErrors[index].quantity}
                        </p>
                      ) : null}
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Giá nhập</label>
                      <input
                        type="number"
                        min="1"
                        value={item.import_price || ""}
                        onChange={(e) =>
                          updateItem(index, "import_price", Number(e.target.value) || 0)
                        }
                        onFocus={(e) => e.target.select()}
                        disabled={isReadonlyEdit}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nhập giá"
                      />
                      {formErrors.itemErrors?.[index]?.import_price ? (
                        <p className="text-sm text-red-600 mt-1">
                          {formErrors.itemErrors[index].import_price}
                        </p>
                      ) : null}
                    </div>
                    <div className="col-span-3 sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Thành tiền</label>
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800">
                        {item.sub_amount.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end justify-center pb-1">
                      <button
                        onClick={() => removeItem(index)}
                        disabled={isReadonlyEdit}
                        className={`p-2 rounded-lg transition-all duration-200 ${isReadonlyEdit ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {formErrors.items ? (
                <p className="text-sm text-red-600 mt-2">{formErrors.items}</p>
              ) : null}
              <button
                onClick={addItem}
                disabled={isReadonlyEdit}
                className={`mt-3 flex items-center gap-2 font-medium transition ${isReadonlyEdit ? "text-gray-400 cursor-not-allowed" : "text-emerald-700 hover:text-emerald-800"}`}
              >
                <Plus className="w-4 h-4" /> Thêm sản phẩm
              </button>
            </div>

            {/* Tổng tiền */}
            <div className="text-right text-gray-800 font-bold text-lg mb-4 pb-4 border-t border-gray-200 pt-4">
              Tổng tiền: {calcTotal(formData.items).toLocaleString("vi-VN")} ₫
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {isReadonlyEdit ? (
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Đóng
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    {editing ? "Cập nhật" : "Thêm mới"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      {showStatusModal && statusReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {statusAction === "completed" ? "Xác nhận phiếu" : "Hủy phiếu"}
            </h3>
            <p className="text-sm text-gray-700 mb-6">
              {statusAction === "completed"
                ? "Bạn có chắc muốn xác nhận phiếu này không?"
                : "Bạn có chắc muốn hủy phiếu này không?"}
            </p>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium min-w-[100px] text-center"
              >
                Trở lại
              </button>
              <button
                onClick={submitStatusUpdate}
                className={`px-5 py-2.5 rounded-lg text-white transition-all font-medium min-w-[100px] text-center ${
                  statusAction === "canceled"
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg"
                }`}
              >
                {statusAction === "canceled" ? "Hủy phiếu" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}