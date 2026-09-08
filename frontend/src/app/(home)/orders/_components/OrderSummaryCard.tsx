import React from "react";
import { Wallet, CheckCircle, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

// Lấy những thông tin liên quan đến tiền bạc và nút ấn tải dữ liệu (loading)
interface OrderSummaryCardProps {
  displayTotal: number;
  finalTotal: number;
  isSubmitting: boolean;
  couponCode: string;
  appliedCouponCode: string;
  discountAmount: number;
  isApplyingCoupon: boolean;
  setCouponCode: (code: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  displayTotal,
  finalTotal,
  isSubmitting,
  couponCode,
  appliedCouponCode,
  discountAmount,
  isApplyingCoupon,
  setCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  return (
    <>
      <Card className="border-none shadow-md ring-1 ring-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white p-4">
          <h3 className="font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Tổng cộng
          </h3>
        </div>
        <CardContent className="p-4 space-y-6">
          
          {/* Nhập mã giảm giá */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-600" /> Mã khuyến mãi
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã giảm giá..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!appliedCouponCode || isApplyingCoupon}
                className="flex-1"
              />
              {!appliedCouponCode ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onApplyCoupon}
                  disabled={!couponCode.trim() || isApplyingCoupon}
                  className="shrink-0"
                >
                  {isApplyingCoupon ? "Đang áp dụng..." : "Áp dụng"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onRemoveCoupon}
                  className="shrink-0"
                >
                  <X className="w-4 h-4 mr-1" /> Bỏ mã
                </Button>
              )}
            </div>
            {appliedCouponCode && (
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Đã áp dụng mã: {appliedCouponCode}
              </p>
            )}
          </div>

          <Separator className="my-2" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span>{formatPrice(displayTotal)}</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Vận chuyển:</span>
              <span className="text-green-600 font-medium">Miễn phí</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Giảm giá:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <Separator className="my-2" />
            
            <div className="flex justify-between items-end pt-1">
              <span className="font-bold text-base text-gray-900">
                Tổng thanh toán:
              </span>
              <span className="font-bold text-2xl text-red-600">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>
          
          {/* Nút bấm Submit (Nằm trong form nên khi click nó sẽ gọi hàm onSubmit của Form cha) */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-bold bg-red-600 hover:bg-red-700 shadow-sm mt-2"
            disabled={isSubmitting} // Disable khi form đang gọi API
          >
            {isSubmitting ? "Đang xử lý..." : "Thanh toán ngay"}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 items-start">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Cam kết bảo mật thanh toán. <br /> Hoàn tiền nếu có lỗi giao dịch.
        </p>
      </div>
    </>
  );
};
