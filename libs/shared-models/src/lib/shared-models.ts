// ── Enums ──

export enum UserRole {
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ProductGender {
  BOY = 'BOY',
  GIRL = 'GIRL',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum ProductCategory {
  DRESSES = 'DRESSES',
  ABAYAS = 'ABAYAS',
  HIJABS = 'HIJABS',
  TSHIRTS = 'TSHIRTS',
  HOODIES = 'HOODIES',
  PANTS = 'PANTS',
  SHIRTS = 'SHIRTS',
  JACKETS = 'JACKETS',
  SHORTS = 'SHORTS',
  TRACKSUITS = 'TRACKSUITS',
  ACCESSORIES = 'ACCESSORIES',
  SHOES = 'SHOES',
  BAGS = 'BAGS',
  OTHER = 'OTHER',
}

// ── Company (Brand) ──

export interface ICompany {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  createdAt: string;
}

// ── Product ──

export interface IProduct {
  id: string;
  companyId: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  images: string[];
  category: ProductCategory;
  gender: ProductGender;
  status: ProductStatus;
  createdAt: string;
  /** Populated on read — not stored on the product row */
  company?: ICompany;
  variants?: IProductVariant[];
}

// ── Product Variant (SKU-level) ──

/**
 * Flexible attribute bag stored as JSONB in Supabase.
 * Common keys: size, color, material, age_group, etc.
 */
export type VariantAttributes = Record<string, string>;

export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: VariantAttributes;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

// ── Order ──

export interface ICustomerDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface IOrderItem {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  attributes: VariantAttributes;
}

export interface IOrder {
  id: string;
  customerDetails: ICustomerDetails;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

// ── Validation ──

export const EGYPT_PHONE_RE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
