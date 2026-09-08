import React from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Chú thích: Interface định nghĩa các tham số (Props) mà Component này nhận vào từ Component cha (OrderPage).
// Bằng cách tách ra, file cha chỉ cần truyền dữ liệu vào đây và phó thác việc hiển thị (render) cho thẻ này.
interface CheckoutAddressCardProps {
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  isDefaultAddress: boolean;
  errors: any; // Lấy trạng thái báo lỗi từ React Hook Form
  onOpenAddressDialog: () => void; // Hàm mở Dialog đổi địa chỉ
}

export const CheckoutAddressCard: React.FC<CheckoutAddressCardProps> = ({
  receiverAddress,
  receiverName,
  receiverPhone,
  isDefaultAddress,
  errors,
  onOpenAddressDialog,
}) => {
  return (
    <Card className={`border-none shadow-sm ring-1 ${errors.receiverName ? "ring-red-500" : "ring-gray-200"}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-600" /> Địa chỉ nhận hàng
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpenAddressDialog}
          className="text-blue-600 h-8 font-medium"
        >
          {receiverAddress ? "Thay đổi" : "Chọn địa chỉ"}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Logic hiển thị: Nếu đã có địa chỉ thì in ra thẻ thông tin, nếu chưa thì báo rỗng */}
        {receiverAddress ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>{receiverName}</span>
              <span className="w-[1px] h-4 bg-gray-300"></span>
              <span>{receiverPhone}</span>
              {isDefaultAddress && (
                <>
                  <span className="w-[1px] h-4 bg-gray-300"></span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                    Mặc định
                  </Badge>
                </>
              )}
            </div>
            <p className="text-gray-700 text-sm">{receiverAddress}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded text-center">
            Vui lòng chọn địa chỉ để giao hàng
          </div>
        )}

        {/* Hiển thị lỗi nếu thiếu 1 trong các trường bắt buộc */}
        {(errors.receiverName || errors.receiverAddress) && (
          <p className="text-red-500 text-sm mt-2 font-medium">
            Vui lòng chọn địa chỉ nhận hàng đầy đủ.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
