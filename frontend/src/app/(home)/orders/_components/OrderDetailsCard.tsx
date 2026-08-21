import React from "react";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderItem from "@/components/order/OrderItem";

// Props truyền từ cha xuống để hiển thị danh sách sách người dùng định mua
interface OrderDetailsCardProps {
  displayItems: any[]; 
  errorsDetails?: { message?: string }; // Hứng lỗi nếu giỏ hàng trống từ Zod (React Hook Form)
}

export const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  displayItems,
  errorsDetails,
}) => {
  return (
    <Card className="border-none shadow-sm ring-1 ring-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-500" /> Chi tiết đơn hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 divide-y">
        {errorsDetails && (
          <p className="text-red-500 text-sm font-medium px-2">
            {errorsDetails.message}
          </p>
        )}

        {/* Render: Lặp qua từng sản phẩm (map) để xuất ra giao diện thành các Component OrderItem riêng rẽ */}
        {displayItems.map((item) => (
          <div key={item._id} className="pt-4 first:pt-0">
            <OrderItem
              bookId={item.bookId}
              quantity={item.quantity}
              price={item.price}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
