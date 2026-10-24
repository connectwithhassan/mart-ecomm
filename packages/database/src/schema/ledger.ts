import { pgTable, uuid, varchar, numeric, boolean, text, timestamp, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sellers } from './sellers.js';

export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']);

export const ledgerAccounts = pgTable('ledger_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountNumber: varchar('account_number', { length: 20 }).unique().notNull(), // '1010', '2010', etc.
  name: varchar('name', { length: 100 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const journalReferenceTypeEnum = pgEnum('journal_reference_type', [
  'order_payment',
  'escrow_release',
  'refund',
  'chargeback',
  'fee_deduction',
  'reserve_release',
]);

export const ledgerJournalEntries = pgTable('ledger_journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  entryNumber: varchar('entry_number', { length: 40 }).unique().notNull(), // e.g. JE-2026-1024-0001
  referenceType: journalReferenceTypeEnum('reference_type').notNull(),
  referenceId: uuid('reference_id').notNull(),
  description: text('description').notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerJournalLines = pgTable(
  'ledger_journal_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    journalEntryId: uuid('journal_entry_id')
      .notNull()
      .references(() => ledgerJournalEntries.id, { onDelete: 'restrict' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => ledgerAccounts.id, { onDelete: 'restrict' }),
    sellerId: uuid('seller_id').references(() => sellers.id),
    debitAmount: numeric('debit_amount', { precision: 14, scale: 4 }).default('0.0000').notNull(),
    creditAmount: numeric('credit_amount', { precision: 14, scale: 4 }).default('0.0000').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('chk_positive_debit', sql`${table.debitAmount} >= 0`),
    check('chk_positive_credit', sql`${table.creditAmount} >= 0`),
    check(
      'chk_debit_xor_credit',
      sql`(${table.debitAmount} > 0 AND ${table.creditAmount} = 0) OR (${table.creditAmount} > 0 AND ${table.debitAmount} = 0)`
    ),
  ]
);

export const payoutStatusEnum = pgEnum('payout_status', ['scheduled', 'processing', 'completed', 'failed']);

export const sellerPayouts = pgTable('seller_payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  payoutBatchId: varchar('payout_batch_id', { length: 50 }),
  sellerId: uuid('seller_id').notNull().references(() => sellers.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'wise', 'stripe_transfer', 'mock_payout'
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
  status: payoutStatusEnum('status').default('scheduled').notNull(),
  failureReason: text('failure_reason'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
