import { pgTable, uuid, varchar, numeric, integer, jsonb, timestamp, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { sellers, warehouses } from './sellers.js';
import { productVariants } from './products.js';

export const paymentStatusEnum = pgEnum('payment_status', [
  'requires_payment',
  'processing',
  'captured',
  'partially_refunded',
  'refunded',
  'failed',
]);

export const subOrderStatusEnum = pgEnum('sub_order_status', [
  'payment_pending',
  'processing',
  'manifested',
  'shipped',
  'customs_cleared',
  'out_for_delivery',
  'delivered',
  'disputed',
  'returned',
  'cancelled',
]);

export const parentOrders = pgTable('parent_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 30 }).unique().notNull(),
  customerId: uuid('customer_id').notNull().references(() => users.id),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  exchangeRateApplied: numeric('exchange_rate_applied', { precision: 14, scale: 6 }).notNull(),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }).unique(),
  paymentStatus: paymentStatusEnum('payment_status').default('requires_payment').notNull(),
  shippingAddress: jsonb('shipping_address').notNull(),
  billingAddress: jsonb('billing_address').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subOrders = pgTable('sub_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  subOrderNumber: varchar('sub_order_number', { length: 35 }).unique().notNull(),
  parentOrderId: uuid('parent_order_id').notNull().references(() => parentOrders.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  itemsSubtotal: numeric('items_subtotal', { precision: 12, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 12, scale: 2 }).notNull(),
  customsDutiesAmount: numeric('customs_duties_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  vatGstTaxAmount: numeric('vat_gst_tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  carrierName: varchar('carrier_name', { length: 50 }),
  carrierTrackingCode: varchar('carrier_tracking_code', { length: 255 }),
  carrierLabelUrl: varchar('carrier_label_url', { length: 1000 }),
  commercialInvoiceUrl: varchar('commercial_invoice_url', { length: 1000 }),
  orderStatus: subOrderStatusEnum('order_status').default('payment_pending').notNull(),
  inspectionExpiresAt: timestamp('inspection_expires_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subOrderItems = pgTable(
  'sub_order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subOrderId: uuid('sub_order_id').notNull().references(() => subOrders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id),
    sku: varchar('sku', { length: 100 }).notNull(),
    productTitleSnapshot: varchar('product_title_snapshot', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceUsd: numeric('unit_price_usd', { precision: 12, scale: 2 }).notNull(),
    unitPricePaid: numeric('unit_price_paid', { precision: 12, scale: 2 }).notNull(),
    totalLineAmount: numeric('total_line_amount', { precision: 12, scale: 2 }).notNull(),
    hsCode: varchar('hs_code', { length: 20 }).notNull(),
    dutyRatePercentage: numeric('duty_rate_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    taxRatePercentage: numeric('tax_rate_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    dutyAmount: numeric('duty_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check('chk_item_quantity', sql`${table.quantity} > 0`)]
);
