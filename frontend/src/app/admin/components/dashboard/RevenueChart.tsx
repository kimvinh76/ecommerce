"use client";
import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenueView = "day" | "month" | "year";

interface RevenueChartProps {
  data: Array<{
    period: string;
    revenue: number;
    cost: number;
    profit: number;
    orderCount: number;
  }>;
  loading: boolean;
  revenueView: RevenueView;
  onViewChange: (view: RevenueView) => void;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

function shortVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export default function RevenueChart({
  data,
  loading,
  revenueView,
  onViewChange,
}: RevenueChartProps) {
  const viewLabel =
    revenueView === "day" ? "ngày" : revenueView === "month" ? "tháng" : "năm";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Biểu đồ Doanh thu &amp; Lợi nhuận
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi biến động theo {viewLabel} — chỉ tính đơn hoàn thành
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          {(["day", "month", "year"] as RevenueView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                revenueView === v
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v === "day" ? "Ngày" : v === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
          Doanh thu
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500" />
          Lợi nhuận
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400" />
          Vốn nhập
        </div>
      </div>

      <div className="h-[320px] w-full">
        {loading ? (
          <div className="w-full h-full flex items-end justify-between gap-1 px-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-emerald-100 rounded-t animate-pulse w-full"
                style={{ height: `${30 + ((i * 7) % 60)}%` }}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Activity className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-sm">Không có dữ liệu trong khoảng thời gian này</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "inherit" }}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "inherit" }}
                tickFormatter={shortVND}
                width={60}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload ?? {};
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">
                      <p className="font-semibold text-gray-800 mb-3 text-sm">{label}</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            Doanh thu
                          </span>
                          <span className="font-medium text-gray-800">{formatVND(d.revenue ?? 0)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-red-500">
                            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                            Vốn nhập
                          </span>
                          <span className="font-medium text-gray-800">{formatVND(d.cost ?? 0)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-purple-600">
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                            Lợi nhuận
                          </span>
                          <span className="font-medium text-gray-800">{formatVND(d.profit ?? 0)}</span>
                        </div>
                        <div className="flex justify-between gap-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                          <span>Đơn hoàn thành</span>
                          <span className="font-bold text-gray-700">{d.orderCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradRevenue)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="cost"
                name="Vốn nhập"
                stroke="#f87171"
                strokeWidth={2}
                strokeDasharray="4 3"
                fill="url(#gradCost)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Lợi nhuận"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#gradProfit)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
