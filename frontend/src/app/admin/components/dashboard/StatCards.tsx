"use client";
import {
  BookOpen,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingAmount: number;
  cancelledAmount: number;
  totalCategories: number;
  lowStockBooks: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalProfit: number;
  totalCost: number;
  revenueChange: number;
  ordersChange: number;
  profitChange: number;
  usersChange: number;
}

interface StatCardsProps {
  stats: Stats;
  loading: boolean;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

function TrendIndicator({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <ArrowUp className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
        <ArrowDown className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
      <Minus className="w-3 h-3" />
      0%
    </span>
  );
}

export default function StatCards({ stats, loading }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {/* Doanh thu - chiếm 2 cột */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-emerald-100 text-sm font-medium">Doanh thu (đơn hoàn thành)</p>
          <div className="bg-white/20 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-2 font-mono">
          {loading ? "..." : formatVND(stats.totalRevenue)}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <TrendIndicator value={stats.revenueChange} />
          <span className="text-xs text-emerald-100">so tháng trước</span>
        </div>
        <div className="text-xs text-emerald-100 flex justify-between border-t border-emerald-500/30 pt-3 gap-2">
          <span>
            Chờ thanh toán:{" "}
            <strong>{loading ? "..." : formatVND(stats.pendingAmount)}</strong>
          </span>
          <span>
            Đã hủy:{" "}
            <strong>{loading ? "..." : formatVND(stats.cancelledAmount)}</strong>
          </span>
        </div>
      </div>

      {/* Đơn hàng */}
      <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-sm font-medium">Đơn hàng</p>
          <div className="bg-blue-50 p-2 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-2">
          {loading ? "..." : stats.totalOrders}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <TrendIndicator value={stats.ordersChange} />
          <span className="text-xs text-gray-500">so tháng trước</span>
        </div>
        <p className="text-xs text-amber-600 border-t border-gray-100 pt-3 font-medium">
          {loading ? "..." : stats.pendingOrders} đơn chờ xử lý
        </p>
      </div>

      {/* Lợi nhuận */}
      <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-500 text-sm font-medium">Lợi nhuận gộp</p>
          <div className="bg-purple-50 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-800 mb-2 font-mono">
          {loading ? "..." : formatVND(stats.totalProfit)}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <TrendIndicator value={stats.profitChange} />
          <span className="text-xs text-gray-500">so tháng trước</span>
        </div>
        <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
          Vốn nhập: <strong className="text-gray-700">{loading ? "..." : formatVND(stats.totalCost)}</strong>
        </p>
      </div>

      {/* Khách hàng + Sách */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex-1 flex flex-col justify-center bg-indigo-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Khách hàng</p>
              <p className="text-xl font-bold text-gray-800">
                {loading ? "..." : stats.totalUsers}
              </p>
            </div>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-center bg-amber-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Sách trong kho</p>
              <p className="text-xl font-bold text-gray-800">
                {loading ? "..." : stats.totalBooks}
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
