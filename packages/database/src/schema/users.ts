import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'seller', 'staff', 'super_admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'pending_verification']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  role: userRoleEnum('role').default('customer').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }),
  preferredCurrency: varchar('preferred_currency', { length: 3 }).default('USD').notNull(),
  preferredLanguage: varchar('preferred_language', { length: 5 }).default('en').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
