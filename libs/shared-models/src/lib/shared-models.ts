// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ProductCategory {
  DRESSES = 'DRESSES',
  ABAYAS = 'ABAYAS',
  HIJABS = 'HIJABS',
  ACCESSORIES = 'ACCESSORIES',
  SHOES = 'SHOES',
  BAGS = 'BAGS',
  OTHER = 'OTHER',
}

// Interfaces
export interface IProduct {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  images: string[];
  category: ProductCategory;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  createdAt: string;
}

export interface ICustomerDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  size: string;
  color: string;
}

export interface IOrder {
  id: string;
  customerDetails: ICustomerDetails;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

// Egyptian phone validation
export const EGYPT_PHONE_RE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
