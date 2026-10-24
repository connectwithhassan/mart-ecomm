export type PaymentStatus =
  | 'requires_payment'
  | 'processing'
  | 'captured'
  | 'partially_refunded'
  | 'refunded'
  | 'failed';

export type SubOrderStatus =
  | 'payment_pending'
  | 'processing'
  | 'manifested'
  | 'shipped'
  | 'customs_cleared'
  | 'out_for_delivery'
  | 'delivered'
  | 'disputed'
  | 'returned'
  | 'cancelled';

export interface Address {
  fullName: string;
  companyName?: string;
  country: string; // ISO 3166-1 alpha-2
  state?: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  phone: string;
}

export interface ParentOrder {
  id: string;
  orderNumber: string; // e.g. PO-2026-1024-8901
  customerId: string;
  totalAmount: number; // in customer's chosen checkout currency
  currency: string;
  exchangeRateApplied: number; // Frozen exchange rate applied from USD
  paymentIntentId?: string | null;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubOrder {
  id: string;
  subOrderNumber: string; // e.g. SO-2026-1024-8901-01
  parentOrderId: string;
  sellerId: string;
  warehouseId: string;
  itemsSubtotal: number;
  shippingCost: number;
  customsDutiesAmount: number;
  vatGstTaxAmount: number;
  totalAmount: number;
  carrierName?: string | null;
  carrierTrackingCode?: string | null;
  carrierLabelUrl?: string | null;
  commercialInvoiceUrl?: string | null;
  orderStatus: SubOrderStatus;
  inspectionExpiresAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubOrderItem {
  id: string;
  subOrderId: string;
  variantId: string;
  sku: string;
  productTitleSnapshot: string;
  quantity: number;
  unitPriceUsd: number;
  unitPricePaid: number;
  totalLineAmount: number;
  hsCode: string;
  dutyRatePercentage: number;
  taxRatePercentage: number;
  dutyAmount: number;
  taxAmount: number;
  createdAt: Date;
}
