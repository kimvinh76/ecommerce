import { Author } from "./author.type";
import { Category } from "./category.type";
import { Publisher } from "./publisher.type";

export interface BookDetail {
  _id: string;
  name: string;
  categoryId: Category;
  publisherId: Publisher;
  authors?: string[];
  productCode?: string;
  translator?: string;
  publishYear?: number;
  weight?: number;
  dimensions?: string;
  pageCount?: number;
  format?: string;
  description?: string;
  imageUrl: string[];
  quantity: number;
  price: number;
  isDeleted?: boolean;
  event?: {
    discountPercent: number;
  };
}
export interface BookBanner {
  _id: string;
  totalSold: string;
  book: BookDetail;
}

export interface Book {
  _id: string;
  name: string;
  categoryId: {
    _id: string;
    name: string;
  };
  publisherId: {
    _id: string;
    name: string;
  };
  productCode?: string;
  translator?: string;
  publishYear?: number;
  weight?: number;
  dimensions?: string;
  pageCount?: number;
  format?: string;
  description?: string;
  authors: {
    _id: string;
    name: string;
  }[];
  imageUrl: string[];
  mainImage: string;
  quantity: number;
  price: number;
  event?: {
    discountPercent: number;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BooksResponse {
  message: string;
  data: Book[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
