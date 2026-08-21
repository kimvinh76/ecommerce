import React from "react";
import { Wallet, Banknote, QrCode } from "lucide-react";
import { Controller, Control } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderPayload } from "@/validation/orderSchema";

// Props cho PaymentMethodCard
interface PaymentMethodCardProps {
  control: Control<OrderPayload>; // control này truyền từ hook useForm của cha xuống để điều khiển Input
}

// Chú thích: Component PaymentOption được gộp chung luôn vào file này.
// Bằng cách định nghĩa ngay trong file, nó sẽ không lộ ra ngoài, đảm bảo chỉ dùng cho Card Thanh Toán.
// (Ghi nhớ: Dù viết chung file nhưng nó KHÔNG NẰM TRONG HÀM của PaymentMethodCard, giúp chống re-render vô cớ)
const PaymentOption = ({
  value,
  label,
  icon,
  selected,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  selected: string;
}) => (
  <div
    className={`relative flex items-center justify-between space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${selected === value ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"}`}
  >
    <div className="flex items-center space-x-3 w-full">
      <RadioGroupItem value={value} id={value} />
      <label
        htmlFor={value}
        className="cursor-pointer flex-1 flex items-center gap-2"
      >
        {icon}{" "}
        <span className="font-medium text-gray-900 text-sm">{label}</span>
      </label>
    </div>
  </div>
);

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ control }) => {
  return (
    <Card className="border-none shadow-sm ring-1 ring-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" /> Phương thức thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render: Controller của react-hook-form bao bọc RadioGroup để ghi nhận trực tiếp value người dùng chọn vào State Form */}
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="grid gap-3"
            >
              <PaymentOption
                value="COD"
                label="Thanh toán khi nhận hàng (COD)"
                icon={<Banknote className="text-orange-600 w-5 h-5" />}
                selected={field.value}
              />
              <PaymentOption
                value="MOMO"
                label="Thanh toán MoMo"
                icon={<QrCode className="text-green-600 w-5 h-5" />}
                selected={field.value}
              />
            </RadioGroup>
          )}
        />
      </CardContent>
    </Card>
  );
};
