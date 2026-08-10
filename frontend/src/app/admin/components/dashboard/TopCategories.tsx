"use client";
import { BookOpen } from "lucide-react";

interface Category {
  categoryId: string;
  name: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

interface TopCategoriesProps {
  categories: Category[];
  loading: boolean;
}

const COLORS = ["bg-purple-600", "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-pink-600"];

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function TopCategories({ categories, loading }: TopCategoriesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          Top 5 thể loại bán chạy
        </h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-10" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={cat.categoryId ?? idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-300">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{cat.name}</p>
                      <p className="text-xs text-gray-500">{formatVND(cat.revenue)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {cat.percentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${COLORS[idx % COLORS.length]} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${cat.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-5 text-center">Dựa trên doanh thu đơn hoàn thành</p>
      </div>
    </div>
  );
}
