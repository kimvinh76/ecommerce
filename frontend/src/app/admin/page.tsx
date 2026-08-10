"use client";
import { useState, useEffect } from "react";
import {
  getOverviewStats,
  getProfitStats,
  getTopProducts,
  getTopCategories,
  getPaymentMethodsStats,
  getComparisonStats,
} from "@/api/statisticsApi";

// Child components
import StatCards from "./components/dashboard/StatCards";
import RevenueChart from "./components/dashboard/RevenueChart";
import OrderStatusChart from "./components/dashboard/OrderStatusChart";
import TopProducts from "./components/dashboard/TopProducts";
import TopCategories from "./components/dashboard/TopCategories";
import PaymentMethods from "./components/dashboard/PaymentMethods";

// ─── Types ──────────────────────────────────────────────────────────────────
type RevenueView = "day" | "month" | "year";

interface Stats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalOrderValue: number;
  paidAmount: number;
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

const INITIAL_STATS: Stats = {
  totalBooks: 0,
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalOrderValue: 0,
  paidAmount: 0,
  pendingAmount: 0,
  cancelledAmount: 0,
  totalCategories: 0,
  lowStockBooks: 0,
  pendingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  totalProfit: 0,
  totalCost: 0,
  revenueChange: 0,
  ordersChange: 0,
  profitChange: 0,
  usersChange: 0,
};

// ─── Helper ──────────────────────────────────────────────────────────────────
/** Lấy YYYY-MM-DD theo giờ địa phương (tránh lệch UTC) */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Điền đầy đủ các mốc thời gian còn thiếu trong dảy dữ liệu biểu đồ.
 * Backend chỉ trả về các ngày có đơn hàng; hàm này tạo toàn bộ tập hợp
 * (ngày / tháng / năm) trong khoảng đã chọn, gán 0 cho mức thiếu.
 */
function fillChartTimeline(
  raw: any[],
  view: RevenueView,
  from: string,
  to: string
): any[] {
  const dataMap: Record<string, any> = {};
  raw.forEach((d) => { dataMap[d.period] = d; });

  const result: any[] = [];
  const now = new Date();

  // Nếu không có bộ lọc nguyên mắc thì tự sinh khoảng mặc định
  if (!from || !to) {
    if (view === "month") {
      // 12 tháng gần nhất
      const cur = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      while (cur <= endDate) {
        const label = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
        result.push(dataMap[label] ?? { period: label, revenue: 0, cost: 0, profit: 0, orderCount: 0 });
        cur.setMonth(cur.getMonth() + 1);
      }
    } else if (view === "year") {
      // 5 năm gần nhất
      const startYear = now.getFullYear() - 4;
      for (let y = startYear; y <= now.getFullYear(); y++) {
        const label = String(y);
        result.push(dataMap[label] ?? { period: label, revenue: 0, cost: 0, profit: 0, orderCount: 0 });
      }
    } else {
      // day không có filter → giữ nguyên dữ liệu từ backend
      return raw;
    }
    return result;
  }

  // Có bộ lọc → sinh đầy đủ mốc trong khoảng
  const start = new Date(from + "T00:00:00");
  const end   = new Date(to   + "T00:00:00");

  if (view === "day") {
    const cur = new Date(start);
    while (cur <= end) {
      const label = toLocalDateStr(cur);
      result.push(dataMap[label] ?? { period: label, revenue: 0, cost: 0, profit: 0, orderCount: 0 });
      cur.setDate(cur.getDate() + 1);
    }
  } else if (view === "month") {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonthDate = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cur <= endMonthDate) {
      const label = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      result.push(dataMap[label] ?? { period: label, revenue: 0, cost: 0, profit: 0, orderCount: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      const label = String(y);
      result.push(dataMap[label] ?? { period: label, revenue: 0, cost: 0, profit: 0, orderCount: 0 });
    }
  }

  return result;
}

/**
 * Tự chọn view phù hợp nhất dựa trên độ dài khoảng thời gian.
 */
function autoView(from: string, to: string): RevenueView {
  if (!from || !to) return "month";
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
  if (diff <= 62) return "day";
  if (diff <= 730) return "month";
  return "year";
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // State
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueView, setRevenueView] = useState<RevenueView>("month");

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ methods: any[]; totalOrders: number }>({
    methods: [],
    totalOrders: 0,
  });
  const [widgetLoading, setWidgetLoading] = useState(false);

  // Date filter (dùng chung cho tất cả)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ── Quick-select helpers ────────────────────────────────────────────────
  const setToday = () => {
    const today = toLocalDateStr(new Date());
    setDateFrom(today);
    setDateTo(today);
    setRevenueView("day");
  };

  const setLast7Days = () => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(today.getDate() - 6);
    setDateFrom(toLocalDateStr(past));
    setDateTo(toLocalDateStr(today));
    setRevenueView("day");
  };

  const setThisMonth = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(toLocalDateStr(first));
    setDateTo(toLocalDateStr(today));
    setRevenueView("day");
  };

  // ── Fetch overview + comparison ─────────────────────────────────────────
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const [overviewRes, comparisonRes] = await Promise.all([
          (getOverviewStats as any)(dateFrom || undefined, dateTo || undefined),
          getComparisonStats(),
        ]);

        if (overviewRes.success) {
          setStats({
            ...overviewRes.data,
            ...(comparisonRes.success ? comparisonRes.data : {}),
          });
        } else {
          setError("Không thể tải dữ liệu thống kê");
        }
      } catch {
        setError("Lỗi khi tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [dateFrom, dateTo]);

  // ── Fetch revenue/profit chart ──────────────────────────────────────────
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setRevenueLoading(true);
        const res = await (getProfitStats as any)(
          revenueView,
          dateFrom || null,
          dateTo || null,
        );
        if (res.success) {
          // Điền đầy đủ các mốc thời gian trong khoảng đã chọn (với giá trị 0 nếu không có dữ liệu)
          const filled = fillChartTimeline(res.data, revenueView, dateFrom, dateTo);
          setRevenueData(filled);
        }
      } catch {
        // silent
      } finally {
        setRevenueLoading(false);
      }
    };
    fetchRevenue();
  }, [revenueView, dateFrom, dateTo]);

  // ── Fetch widgets (top products, categories, payment) ───────────────────
  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        setWidgetLoading(true);
        const [productsRes, categoriesRes, paymentRes] = await Promise.all([
          (getTopProducts as any)(5, dateFrom || null, dateTo || null),
          (getTopCategories as any)(5, dateFrom || null, dateTo || null),
          (getPaymentMethodsStats as any)(dateFrom || null, dateTo || null),
        ]);
        if (productsRes.success) setTopProducts(productsRes.data);
        if (categoriesRes.success) setTopCategories(categoriesRes.data);
        if (paymentRes.success) setPaymentMethods(paymentRes.data);
      } catch {
        // silent
      } finally {
        setWidgetLoading(false);
      }
    };
    fetchWidgets();
  }, [dateFrom, dateTo]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* ── Header + filter ─────────────────────────────────────────────── */}
      <div className="bg-white border-l-4 border-emerald-600 px-6 py-5 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-gray-800 text-2xl font-bold">Dashboard — Tổng quan hệ thống</h2>
            <p className="text-gray-500 text-sm mt-0.5">Theo dõi và quản lý hoạt động cửa hàng</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
          {/* Quick-select */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Khoảng thời gian:</span>
            {[
              { label: "Hôm nay", fn: setToday },
              { label: "7 ngày qua", fn: setLast7Days },
              { label: "Tháng này", fn: setThisMonth },
            ].map(({ label, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 rounded-lg transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Từ:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setDateFrom(newFrom);
                  // Chỉ auto-switch khi cả 2 ô đều có giá trị
                  if (newFrom && dateTo) setRevenueView(autoView(newFrom, dateTo));
                }}
                className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Đến:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  const newTo = e.target.value;
                  setDateTo(newTo);
                  // Chỉ auto-switch khi cả 2 ô đều có giá trị
                  if (dateFrom && newTo) setRevenueView(autoView(dateFrom, newTo));
                }}
                className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-red-700 font-medium hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <StatCards stats={stats} loading={loading} />

      {/* ── Revenue chart ───────────────────────────────────────────────── */}
      <RevenueChart
        data={revenueData}
        loading={revenueLoading}
        revenueView={revenueView}
        onViewChange={setRevenueView}
      />

      {/* ── 3-column row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopProducts products={topProducts} loading={widgetLoading} />

        <OrderStatusChart
          completedOrders={stats.completedOrders}
          pendingOrders={stats.pendingOrders}
          cancelledOrders={stats.cancelledOrders}
          totalOrders={stats.totalOrders}
          loading={loading}
        />

        <TopCategories categories={topCategories} loading={widgetLoading} />
      </div>

      {/* ── Payment methods ─────────────────────────────────────────────── */}
      <PaymentMethods
        methods={paymentMethods.methods ?? []}
        totalOrders={paymentMethods.totalOrders ?? 0}
        loading={widgetLoading}
      />
    </div>
  );
}
