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

// ── Color Palette ──

export interface PaletteColor {
  key: string;
  nameEn: string;
  nameAr: string;
  hex: string;
}

export const COLOR_PALETTE: PaletteColor[] = [
  // Neutrals
  { key: 'black',      nameEn: 'Black',        nameAr: 'أسود',          hex: '#1F2937' },
  { key: 'white',      nameEn: 'White',        nameAr: 'أبيض',          hex: '#F9FAFB' },
  { key: 'offwhite',   nameEn: 'Off White',    nameAr: 'أوف وايت',      hex: '#FAF9F6' },
  { key: 'ivory',      nameEn: 'Ivory',        nameAr: 'عاجي',          hex: '#FFFFF0' },
  { key: 'cream',      nameEn: 'Cream',        nameAr: 'كريمي',         hex: '#FFFDD0' },

  // Red family
  { key: 'lightred',   nameEn: 'Light Red',    nameAr: 'أحمر فاتح',     hex: '#FCA5A5' },
  { key: 'red',        nameEn: 'Red',          nameAr: 'أحمر',          hex: '#EF4444' },
  { key: 'darkred',    nameEn: 'Dark Red',     nameAr: 'أحمر غامق',     hex: '#B91C1C' },

  // Blue family
  { key: 'lightblue',  nameEn: 'Baby Blue',    nameAr: 'بيبي بلو',       hex: '#89CFF0' },
  { key: 'blue',       nameEn: 'Blue',         nameAr: 'أزرق',          hex: '#3B82F6' },
  { key: 'darkblue',   nameEn: 'Dark Blue',    nameAr: 'أزرق غامق',     hex: '#1E3A5F' },

  // Green family
  { key: 'lightgreen', nameEn: 'Light Green',  nameAr: 'أخضر فاتح',     hex: '#86EFAC' },
  { key: 'green',      nameEn: 'Green',        nameAr: 'أخضر',          hex: '#22C55E' },
  { key: 'darkgreen',  nameEn: 'Dark Green',   nameAr: 'أخضر غامق',     hex: '#166534' },

  // Yellow family
  { key: 'lightyellow', nameEn: 'Light Yellow', nameAr: 'أصفر فاتح',    hex: '#FEF08A' },
  { key: 'yellow',     nameEn: 'Yellow',       nameAr: 'أصفر',          hex: '#EAB308' },
  { key: 'darkyellow', nameEn: 'Dark Yellow',  nameAr: 'أصفر غامق',     hex: '#A16207' },

  // Pink family
  { key: 'lightpink',  nameEn: 'Light Pink',   nameAr: 'وردي فاتح',     hex: '#F4C2C2' },
  { key: 'pink',       nameEn: 'Pink',         nameAr: 'وردي',          hex: '#EC4899' },
  { key: 'darkpink',   nameEn: 'Dark Pink',    nameAr: 'وردي غامق',     hex: '#BE185D' },

  // Purple family
  { key: 'lightpurple', nameEn: 'Light Purple', nameAr: 'بنفسجي فاتح',  hex: '#C4B5FD' },
  { key: 'purple',     nameEn: 'Purple',       nameAr: 'بنفسجي',        hex: '#A855F7' },
  { key: 'darkpurple', nameEn: 'Dark Purple',  nameAr: 'بنفسجي غامق',   hex: '#6B21A8' },

  // Orange family
  { key: 'lightorange', nameEn: 'Light Orange', nameAr: 'برتقالي فاتح', hex: '#FDBA74' },
  { key: 'orange',     nameEn: 'Orange',       nameAr: 'برتقالي',       hex: '#F97316' },
  { key: 'darkorange', nameEn: 'Dark Orange',  nameAr: 'برتقالي غامق',  hex: '#C2410C' },

  // Brown family
  { key: 'lightbrown', nameEn: 'Light Brown',  nameAr: 'بني فاتح',      hex: '#D2B48C' },
  { key: 'brown',      nameEn: 'Brown',        nameAr: 'بني',           hex: '#92400E' },
  { key: 'darkbrown',  nameEn: 'Dark Brown',   nameAr: 'بني غامق',      hex: '#451A03' },

  // Gray family
  { key: 'lightgray',  nameEn: 'Light Gray',   nameAr: 'رمادي فاتح',    hex: '#D1D5DB' },
  { key: 'gray',       nameEn: 'Gray',         nameAr: 'رمادي',         hex: '#6B7280' },
  { key: 'darkgray',   nameEn: 'Dark Gray',    nameAr: 'رمادي غامق',    hex: '#374151' },

  // Olive family
  { key: 'lightolive', nameEn: 'Light Olive',  nameAr: 'زيتي فاتح',     hex: '#B5CC6A' },
  { key: 'olive',      nameEn: 'Olive',        nameAr: 'زيتي',          hex: '#808000' },
  { key: 'darkolive',  nameEn: 'Dark Olive',   nameAr: 'زيتي غامق',     hex: '#556B2F' },

  // Teal family
  { key: 'lightteal',  nameEn: 'Light Teal',   nameAr: 'تيل فاتح',      hex: '#66CDAA' },
  { key: 'teal',       nameEn: 'Teal',         nameAr: 'أخضر مزرق',     hex: '#008080' },
  { key: 'darkteal',   nameEn: 'Dark Teal',    nameAr: 'تيل غامق',      hex: '#004D4D' },

  // Standalone colors
  { key: 'beige',      nameEn: 'Beige',        nameAr: 'بيج',           hex: '#D4C5A9' },
  { key: 'turquoise',  nameEn: 'Turquoise',    nameAr: 'تركواز',        hex: '#40E0D0' },
  { key: 'fuchsia',    nameEn: 'Fuchsia',      nameAr: 'فوشيا',         hex: '#D946EF' },
  { key: 'camel',      nameEn: 'Camel',        nameAr: 'جملي',          hex: '#C19A6B' },
  { key: 'burgundy',   nameEn: 'Burgundy',     nameAr: 'نبيتي',         hex: '#800020' },
  { key: 'coral',      nameEn: 'Coral',        nameAr: 'مرجاني',        hex: '#FF7F50' },
  { key: 'khaki',      nameEn: 'Khaki',        nameAr: 'كاكي',          hex: '#C3B091' },
  { key: 'mint',       nameEn: 'Mint',         nameAr: 'نعناعي',        hex: '#98FB98' },
  { key: 'lavender',   nameEn: 'Lavender',     nameAr: 'لافندر',        hex: '#B4A7D6' },
  { key: 'peach',      nameEn: 'Peach',        nameAr: 'خوخي',          hex: '#FFCBA4' },
  { key: 'gold',       nameEn: 'Gold',         nameAr: 'ذهبي',          hex: '#D4AF37' },
  { key: 'silver',     nameEn: 'Silver',       nameAr: 'فضي',           hex: '#C0C0C0' },
  { key: 'rose',       nameEn: 'Rose',         nameAr: 'روز',           hex: '#E8909C' },
  { key: 'maroon',     nameEn: 'Maroon',       nameAr: 'ماروني',        hex: '#800000' },
  { key: 'indigo',     nameEn: 'Indigo',       nameAr: 'نيلي',          hex: '#4B0082' },
  { key: 'denim',      nameEn: 'Denim',        nameAr: 'جينز',          hex: '#6F8FAF' },
  { key: 'mustard',    nameEn: 'Mustard',      nameAr: 'خردلي',         hex: '#FFDB58' },
  { key: 'wine',       nameEn: 'Wine',         nameAr: 'عنابي',         hex: '#722F37' },
  { key: 'lilac',      nameEn: 'Lilac',        nameAr: 'ليلكي',         hex: '#C8A2C8' },
  { key: 'salmon',     nameEn: 'Salmon',       nameAr: 'سلموني',        hex: '#FA8072' },
  { key: 'aqua',       nameEn: 'Aqua',         nameAr: 'أكوا',          hex: '#00FFFF' },
  { key: 'rust',       nameEn: 'Rust',         nameAr: 'صدأ',           hex: '#B7410E' },
  { key: 'magenta',    nameEn: 'Magenta',      nameAr: 'ماجنتا',        hex: '#FF00FF' },
  { key: 'copper',     nameEn: 'Copper',       nameAr: 'نحاسي',         hex: '#B87333' },
  { key: 'sage',       nameEn: 'Sage',         nameAr: 'أخضر رمادي',    hex: '#B2AC88' },
  { key: 'mauve',      nameEn: 'Mauve',        nameAr: 'موف',           hex: '#E0B0FF' },
];

// ── Validation ──

export const EGYPT_PHONE_RE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
