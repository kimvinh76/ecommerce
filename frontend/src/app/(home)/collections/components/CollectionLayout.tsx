import Link from "next/link";
import React from "react";
import { ChevronRight, Home } from "lucide-react";
import FilterSidebar from "./FilterSidebar";
import ProductGrid from "./ProductGrid";
import ProductPagination from "./ProductPagination";

interface CollectionLayoutProps {
  category?: { name: string; _id?: string };
  categorySlug?: string;
  data: any; // Response data từ bookServices
}

export default function CollectionLayout({ category, categorySlug, data }: CollectionLayoutProps) {
  const isCategoryPage = !!category;

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 mt-4 max-w-7xl mx-auto">
        {/* Thanh điều hướng (Breadcrumb) */}
        <nav className="flex justify-start my-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-gray-600 hover:text-green-600 transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Trang chủ
              </Link>
            </li>
            <li className="text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </li>
            
            {isCategoryPage ? (
              <>
                <li>
                  <Link
                    href={"/collections"}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Danh mục
                  </Link>
                </li>
                <li className="text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                </li>
                <li className="text-green-600 font-medium">{category.name}</li>
              </>
            ) : (
              <li>
                <span className="text-gray-600 hover:text-green-600 transition-colors">
                  Danh mục
                </span>
              </li>
            )}
          </ol>
        </nav>

        {/* Tiêu đề trang (Page Header) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isCategoryPage ? `Sách ${category.name}` : "Tất cả sách"}
          </h1>
          <p className="text-gray-600 max-w-3xl">
            {isCategoryPage 
              ? `Khám phá bộ sưu tập sách ${category.name} đa dạng từ các tác giả trong nước và quốc tế. Từ những tác phẩm kinh điển đến các tác phẩm đương đại nổi bật.`
              : "Khám phá bộ sưu tập sách đa dạng từ các tác giả trong nước và quốc tế. Từ những tác phẩm kinh điển đến các tác phẩm đương đại nổi bật."}
          </p>
        </div>

        {/* Bố cục chính: Cột lọc bên trái và Cột sản phẩm bên phải */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 mb-8">
          {/* Bộ lọc (Filter Sidebar) */}
          <FilterSidebar />

          {/* Cột sản phẩm (Product Grids) */}
          <div className="flex-1">
            <ProductGrid
              categoryName={category?.name}
              products={data.data}
              totalCount={data.pagination?.totalItems || 0}
            />

            <ProductPagination
              categorySlug={categorySlug}
              currentPage={data.pagination?.currentPage || 1}
              totalPages={data.pagination?.totalPages || 1}
              hasNext={data.pagination?.hasNext || false}
              hasPrev={data.pagination?.hasPrev || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
