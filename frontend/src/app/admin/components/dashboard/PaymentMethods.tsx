"use client";
import { DollarSign } from "lucide-react";

interface PaymentMethod {
  method: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  totalOrders: number;
  loading: boolean;
}

const METHOD_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  COD: { label: "COD (Tiền mặt)", icon: "💵", color: "bg-emerald-600" },
  cash: { label: "COD (Tiền mặt)", icon: "💵", color: "bg-emerald-600" },
  MOMO: { label: "MoMo", icon: "👜", color: "bg-pink-600" },
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function PaymentMethods({ methods, totalOrders, loading }: PaymentMethodsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          Phương thức thanh toán
        </h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-10" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5" />
              </div>
            ))}
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="space-y-5">
            {methods.map((payment) => {
              const config = METHOD_CONFIG[payment.method] ?? {
                label: payment.method,
                icon: "💰",
                color: "bg-gray-600",
              };
              return (
                <div key={payment.method}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{config.label}</p>
                        <p className="text-xs text-gray-500">
                          {payment.count} đơn — {formatVND(payment.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-gray-700">
                      {payment.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`${config.color} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: `${payment.percentage ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Tổng giao dịch</span>
          <span className="text-xl font-bold text-indigo-600">{totalOrders}</span>
        </div>
      </div>
    </div>
  );
}
