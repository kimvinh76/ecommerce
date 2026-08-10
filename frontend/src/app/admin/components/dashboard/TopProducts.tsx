"use client";
import Image from "next/image";
import { Package } from "lucide-react";

interface Product {
  bookId: string;
  bookName: string;
  bookImage?: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsProps {
  products: Product[];
  loading: boolean;
}

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function TopProducts({ products, loading }: TopProductsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Top 5 sách bán chạy
        </h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                <div className="w-10 h-14 bg-gray-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-10" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-medium">Chưa có dữ liệu</p>
            <p className="text-sm mt-1">Sản phẩm bán chạy sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product, idx) => (
              <div
                key={product.bookId}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">#{idx + 1}</span>
                </div>
                <Image
                  src={product.bookImage || "https://placehold.co/400x600/e2e8f0/64748b?text=No+Image"}
                  alt={product.bookName}
                  width={40}
                  height={56}
                  className="w-10 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm truncate">{product.bookName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatVND(product.totalRevenue)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-600 font-bold text-lg leading-none">{product.totalQuantity}</p>
                  <p className="text-xs text-gray-500 mt-0.5">đã bán</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
