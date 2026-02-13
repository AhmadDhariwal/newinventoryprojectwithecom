import { Category } from "./category.model";

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  category?: Category;
  cost: number;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;

  images?: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
