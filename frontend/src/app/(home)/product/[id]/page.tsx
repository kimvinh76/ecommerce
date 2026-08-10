import { bookServices } from "@/services/bookServices";
import React from "react";

import { notFound } from "next/navigation";
import { Truck, Shield, Leaf, CheckCircle } from "lucide-react";



import ImageSlider from "../components/ImageSlider";
import PurchaseCard from "../components/PurchaseCard";
import ProductReviewsSection from "../components/ProductReviewsSection";
import ProductDescriptionSection from "../components/ProductDescriptionSection";

const ProductDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  let book;

  try {
    book = await bookServices.getBookById(id);
  } catch (error: any) {
    // If backend responded with 400/404 for missing product, render Next.js 404
    if (error?.status === 400 || error?.status === 404) {
      notFound();
    }
    // otherwise rethrow so the error surface is visible during development
    throw error;
  }
  const detailRows = [
    {
      label: "Tác giả",
      value:
        book.authors && book.authors.length > 0
          ? book.authors.join(", ")
          : "Chưa cập nhật",
    },
    {
      label: "NXB",
      value: book.publisherId?.name || "Chưa cập nhật",
    },
    {
      label: "Năm XB",
      value: book.publishYear ? String(book.publishYear) : "Chưa cập nhật",
    },
    {
      label: "Kích Thước Bao Bì",
      value: book.dimensions || "Chưa cập nhật",
    },
    {
      label: "Số trang",
      value: book.pageCount ? String(book.pageCount) : "Chưa cập nhật",
    },
    {
      label: "Hình thức",
      value: book.format || "Chưa cập nhật",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Two-column section: left stays sticky while right content scrolls */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* CỘT TRÁI */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
            <ImageSlider images={book.imageUrl} />
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="text-green-600" size={24} />
              SuperBook đảm bảo
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span>Sách thật từ nhà xuất bản</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span>Không rách giấy, long bìa, viết bậy</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                <span>Số trang highlight (không quá 10% tổng số trang)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Truck size={20} />
                <span className="font-semibold">Freeship toàn quốc chỉ từ 100k</span>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                  <span>Được kiểm tra thanh toán khi nhận hàng</span>
                </li>
                <li className="flex items-start gap-3">

                  <span className="flex items-center gap-2">
                    <Leaf className="text-green-500" size={18} />
                    Với mỗi cuốn sách bán ra, Super Book sẽ trích 1000 VND để ủng hộ
                    các tổ chức bảo vệ môi trường
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI */}
        <main className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <h1 className="text-3xl font-bold text-gray-900">{book?.name || "Sách"}</h1>

            <div className="space-y-3 mt-3">
              <div className="text-gray-700">
                <span className="font-semibold">Nhà xuất bản: </span>
                <span className="text-gray-800">{book?.publisherId?.name || "NXB Trẻ"}</span>
              </div>
              <div className="text-gray-700">
                <span className="font-semibold">Tác giả: </span>
                <span className="text-gray-800">
                  {book?.authors && book.authors.length > 0
                    ? book.authors.join(", ")
                    : "Robert Galbraith"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-green-100">
              <PurchaseCard book={book} compact />
            </div>
          </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin chi tiết</h3>
                      <table className="w-full text-gray-700 border-collapse">
                        <tbody>
                          {detailRows.map((row) => (
                            <tr key={row.label} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                              <td className="font-semibold py-3 pr-4 w-1/3 align-top">{row.label}</td>
                              <td className="py-3 align-top">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

          <ProductDescriptionSection
            title={book.name || "Sách"}
            description={book.description || "Chưa có mô tả cho cuốn sách này."}
          />
        </main>
      </div>

      {/* Footer appears after both columns section ends */}
      <div className="mt-8">
        <ProductReviewsSection bookId={id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;
