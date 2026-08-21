"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Ticket, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Coupon, deleteCoupon, getAllCoupons } from "@/services/couponService";
import { formatPrice } from "@/lib/utils";
import CouponModal from "./_components/CouponModal";

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  const fetcher = async () => {
    return await getAllCoupons({
      page,
      limit: 10,
      search: searchTerm,
    });
  };

  const { data, isLoading, mutate } = useSWR(
    `/coupons?page=${page}&search=${searchTerm}`,
    fetcher
  );

  const coupons = data?.data || [];

  const handleOpenCreate = () => {
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await deleteCoupon(couponToDelete._id);
      toast.success("Xóa mã giảm giá thành công");
      setIsDeleteOpen(false);
      setCouponToDelete(null);
      mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa mã giảm giá");
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="w-8 h-8 text-blue-600" />
            Quản lý mã giảm giá
          </h1>
          <p className="text-gray-500 mt-1">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm mã mới
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Mã Code</TableHead>
              <TableHead>Loại giảm</TableHead>
              <TableHead>Mức giảm</TableHead>
              <TableHead>Lượt dùng</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  Không tìm thấy mã giảm giá nào
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell className="font-bold text-blue-700">
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === "percent" ? (
                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                        Phần trăm
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Tiền mặt
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === "percent"
                      ? `${coupon.discountValue}%`
                      : formatPrice(coupon.discountValue)}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {coupon.usedCount} / {coupon.usageLimit > 0 ? coupon.usageLimit : "∞"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 space-y-1">
                    <div>B: {new Date(coupon.startDate).toLocaleString("vi-VN")}</div>
                    <div>K: {new Date(coupon.endDate).toLocaleString("vi-VN")}</div>
                  </TableCell>
                  <TableCell>
                    {coupon.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Hoạt động</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">Đã khóa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(coupon)}>
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(coupon)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coupon={selectedCoupon}
        onSuccess={() => mutate()}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa mã giảm giá <b>{couponToDelete?.code}</b>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Xóa mã
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
