import React from "react";
import { categoryServices } from "@/services/categoryServices";
import { ProductsPageProps } from "@/types/page.type";
import { bookServices } from "@/services/bookServices";
import { parseSearchParams } from "@/lib/utils";
import CollectionLayout from "../components/CollectionLayout";

const Page = async ({ params, searchParams }: ProductsPageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const parser = parseSearchParams(resolvedSearchParams);

  // Lấy categorySlug từ URL parameters
  const { categorySlug } = resolvedParams;
  // Lấy thông tin Category từ API
  const category = await categoryServices.getCategoryBySlug(categorySlug);

  const currentPage = parser.getNumber("page", 1);
  const search = parser.getString("search");
  const minPrice = parser.getNumber("minPrice");
  const maxPrice = parser.getNumber("maxPrice");
  const sortBy = parser.getString("sortBy") || "newest";
  const publishers = parser.getStringArray("publishers");
  const eventId = parser.getString("event");

  // Gọi API lấy sách thuộc Category này
  const data = await bookServices.getBooks(
    currentPage,
    12,
    category._id, // Truyền ID của category
    publishers,
    search,
    minPrice,
    maxPrice,
    sortBy,
    eventId
  );

  // Truyền data và thông tin category vào giao diện dùng chung
  return (
    <CollectionLayout 
      category={category} 
      categorySlug={categorySlug} 
      data={data} 
    />
  );
};

export default Page;
