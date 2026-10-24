import { pgTable, uuid, varchar, numeric, integer, boolean, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'under_review', 'approved', 'rejected']);

export const sellers = pgTable('sellers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  legalEntityType: varchar('legal_entity_type', { length: 50 }).notNull(), // 'individual', 'corporation', 'llc'
  taxIdNumber: varchar('tax_id_number', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO-2
  stripeConnectedAccountId: varchar('stripe_connected_account_id', { length: 255 }),
  wiseRecipientId: varchar('wise_recipient_id', { length: 255 }),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).default('10.00').notNull(),
  rollingReserveRate: numeric('rolling_reserve_rate', { precision: 5, scale: 2 }).default('10.00').notNull(),
  rollingReserveDays: integer('rolling_reserve_days').default(60).notNull(),
  escrowInspectionDays: integer('escrow_inspection_days').default(14).notNull(),
  kycStatus: kycStatusEnum('kyc_status').default('pending').notNull(),
  kycDocuments: jsonb('kyc_documents').default([]).notNull(),
  payoutBankDetails: jsonb('payout_bank_details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const warehouses = pgTable('warehouses', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  warehouseName: varchar('warehouse_name', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }).notNull(), // Dispatch Origin Country
  stateProvince: varchar('state_province', { length: 100 }),
  city: varchar('city', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line_2', { length: 255 }),
  phoneContact: varchar('phone_contact', { length: 30 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
