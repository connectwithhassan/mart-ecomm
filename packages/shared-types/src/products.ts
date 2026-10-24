export type ProductStatus = 'draft' | 'pending_approval' | 'active' | 'archived';

export interface Category {
  id: string;
  parentId?: string | null;
  slug: string;
  nameI18n: Record<string, string>; // { "en": "Keyboards", "ar": "لوحات مفاتيح" }
  hsCodeDefault?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  titleI18n: Record<string, string>;
  descriptionI18n: Record<string, string>;
  brand?: string | null;
  hsCode: string; // 6-10 digit Harmonized System tariff code
  originCountry: string; // ISO 3166-1 alpha-2
  status: ProductStatus;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  titleI18n?: Record<string, string> | null;
  attributes: Record<string, string>; // { "color": "Midnight", "switch": "Brown" }
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  basePriceUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  id: string;
  variantId: string;
  warehouseId: string;
  availableStock: number;
  reservedStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export type InventoryMovementType =
  | 'stock_in'
  | 'reservation_placed'
  | 'reservation_released'
  | 'reservation_fulfilled'
  | 'adjustment'
  | 'return_restock';

export interface InventoryTransaction {
  id: string;
  variantId: string;
  warehouseId: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  referenceOrderId?: string | null;
  reason?: string | null;
  createdAt: Date;
}
