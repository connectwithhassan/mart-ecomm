import { pgTable, uuid, varchar, numeric, boolean, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sellers } from './sellers.js';

export const productStatusEnum = pgEnum('product_status', ['draft', 'pending_approval', 'active', 'archived']);

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: uuid('parent_id'),
  slug: varchar('slug', { length: 120 }).unique().notNull(),
  nameI18n: jsonb('name_i18n').notNull(),
  hsCodeDefault: varchar('hs_code_default', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  titleI18n: jsonb('title_i18n').notNull(),
  descriptionI18n: jsonb('description_i18n').notNull(),
  brand: varchar('brand', { length: 100 }),
  hsCode: varchar('hs_code', { length: 20 }).notNull(), // Harmonized Tariff Code
  originCountry: varchar('origin_country', { length: 2 }).notNull(), // ISO-2
  status: productStatusEnum('status').default('draft').notNull(),
  images: jsonb('images').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  titleI18n: jsonb('title_i18n'),
  attributes: jsonb('attributes').default({}).notNull(),
  weightGrams: numeric('weight_grams', { precision: 10, scale: 2 }).notNull(),
  lengthCm: numeric('length_cm', { precision: 10, scale: 2 }).notNull(),
  widthCm: numeric('width_cm', { precision: 10, scale: 2 }).notNull(),
  heightCm: numeric('height_cm', { precision: 10, scale: 2 }).notNull(),
  basePriceUsd: numeric('base_price_usd', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
