import { pgTable, uuid, integer, text, timestamp, pgEnum, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { productVariants } from './products.js';
import { warehouses } from './sellers.js';

export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'stock_in',
  'reservation_placed',
  'reservation_released',
  'reservation_fulfilled',
  'adjustment',
  'return_restock',
]);

export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
    availableStock: integer('available_stock').default(0).notNull(),
    reservedStock: integer('reserved_stock').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_variant_warehouse').on(table.variantId, table.warehouseId),
    check('chk_positive_available_stock', sql`${table.availableStock} >= 0`),
    check('chk_positive_reserved_stock', sql`${table.reservedStock} >= 0`),
  ]
);

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  movementType: inventoryMovementTypeEnum('movement_type').notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  referenceOrderId: uuid('reference_order_id'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
