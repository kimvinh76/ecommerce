import React from "react";
import { ProductsPageProps } from "@/types/page.type";
import { bookServices } from "@/services/bookServices";
import { parseSearchParams } from "@/lib/utils";
import CollectionLayout from "./components/CollectionLayout";

const Page = async ({ params, searchParams }: ProductsPageProps) => {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const parser = parseSearchParams(resolvedSearchParams);
  const currentPage = parser.getNumber("page", 1);
  const search = parser.getString("search");
  const minPrice = parser.getNumber("minPrice");
  const maxPrice = parser.getNumber("maxPrice");
  const sortBy = parser.getString("sortBy") || "newest";
  const publishers = parser.getStringArray("publishers");
  const eventId = parser.getString("event");

  // Gọi API lấy TẤT CẢ sách (không có categoryId)
  const data = await bookServices.getBooks(
    currentPage,
    12,
    "", // categoryId rỗng
    publishers,
    search,
    minPrice,
    maxPrice,
    sortBy,
    eventId
  );

  // Truyền data vào giao diện dùng chung
  return <CollectionLayout data={data} />;
};

export default Page;
