"use client";
import { ShoppingCart } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface OrderStatusChartProps {
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  loading: boolean;
}

const SLICES = [
  { key: "completedOrders", name: "Hoàn thành", color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
  { key: "pendingOrders", name: "Chờ xử lý", color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600" },
  { key: "cancelledOrders", name: "Đã hủy", color: "#9ca3af", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" },
];

export default function OrderStatusChart({
  completedOrders,
  pendingOrders,
  cancelledOrders,
  totalOrders,
  loading,
}: OrderStatusChartProps) {
  const counts: Record<string, number> = { completedOrders, pendingOrders, cancelledOrders };

  const pieData = SLICES
    .map((s) => ({ name: s.name, value: counts[s.key], color: s.color }))
    .filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          Trạng thái đơn hàng
        </h3>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* Donut */}
        <div className="h-[200px] relative mb-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-4 border-gray-100 border-t-blue-400 animate-spin" />
            </div>
          ) : totalOrders === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-8 h-8 mb-2 text-gray-300" />
              <span className="text-sm">Chưa có đơn hàng</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} đơn`, ""]}
                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-800">{totalOrders}</span>
                <span className="text-xs text-gray-400">Tổng đơn</span>
              </div>
            </>
          )}
        </div>

        {/* Legend list */}
        <div className="space-y-2 mt-auto">
          {SLICES.map((s) => (
            <div
              key={s.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${s.bg} ${s.border} transition-colors hover:brightness-95`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full`} style={{ background: s.color }} />
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
              </div>
              <span className={`text-sm font-bold ${s.text}`}>
                {loading ? "..." : counts[s.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
