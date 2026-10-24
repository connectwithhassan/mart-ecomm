import { pgTable, uuid, varchar, numeric, jsonb, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { subOrders } from './orders.js';

export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  subOrderId: uuid('sub_order_id').notNull().references(() => subOrders.id, { onDelete: 'cascade' }),
  carrier: varchar('carrier', { length: 50 }).notNull(), // 'DHL', 'FedEx', 'UPS', 'Aramex'
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull(),
  labelFormat: varchar('label_format', { length: 10 }).default('PDF').notNull(),
  labelUrl: text('label_url').notNull(),
  commercialInvoiceUrl: text('commercial_invoice_url').notNull(),
  weightKg: numeric('weight_kg', { precision: 8, scale: 3 }).notNull(),
  customsDeclaration: jsonb('customs_declaration').notNull(),
  currentStatus: varchar('current_status', { length: 50 }).default('manifested').notNull(),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }),
  actualDelivery: timestamp('actual_delivery', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: varchar('source', { length: 50 }).notNull(), // 'stripe', 'easypost', 'wise'
    eventId: varchar('event_id', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 30 }).default('pending').notNull(),
    errorMessage: text('error_message'),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_webhook_source_event').on(table.source, table.eventId),
  ]
);
