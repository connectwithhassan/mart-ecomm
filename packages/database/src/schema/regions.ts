import { pgTable, uuid, varchar, numeric, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 10 }).unique().notNull(), // 'US', 'EU', 'GCC', 'PK'
  name: varchar('name', { length: 100 }).notNull(),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull(),
  taxEngine: varchar('tax_engine', { length: 50 }).default('stripe_tax').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    baseCurrency: varchar('base_currency', { length: 3 }).default('USD').notNull(),
    targetCurrency: varchar('target_currency', { length: 3 }).notNull(),
    marketRate: numeric('market_rate', { precision: 14, scale: 6 }).notNull(),
    bufferPercentage: numeric('buffer_percentage', { precision: 5, scale: 2 }).default('1.50').notNull(),
    effectiveRate: numeric('effective_rate', { precision: 14, scale: 6 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('uq_base_target_currency').on(table.baseCurrency, table.targetCurrency),
  ]
);
