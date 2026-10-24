import { describe, it, expect } from 'vitest';
import * as schema from '../schema/index.js';

describe('Database Schema Definitions', () => {
  it('exports all core domain tables', () => {
    expect(schema.users).toBeDefined();
    expect(schema.regions).toBeDefined();
    expect(schema.exchangeRates).toBeDefined();
    expect(schema.sellers).toBeDefined();
    expect(schema.warehouses).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.products).toBeDefined();
    expect(schema.productVariants).toBeDefined();
    expect(schema.inventoryLevels).toBeDefined();
    expect(schema.inventoryTransactions).toBeDefined();
    expect(schema.parentOrders).toBeDefined();
    expect(schema.subOrders).toBeDefined();
    expect(schema.subOrderItems).toBeDefined();
    expect(schema.ledgerAccounts).toBeDefined();
    expect(schema.ledgerJournalEntries).toBeDefined();
    expect(schema.ledgerJournalLines).toBeDefined();
    expect(schema.sellerPayouts).toBeDefined();
    expect(schema.shipments).toBeDefined();
    expect(schema.webhookEvents).toBeDefined();
  });

  it('verifies user roles enum includes all 4 system roles', () => {
    expect(schema.userRoleEnum.enumValues).toEqual(['customer', 'seller', 'staff', 'super_admin']);
  });

  it('verifies sub-order items table has mandatory cross-border customs fields', () => {
    expect(schema.subOrderItems.hsCode).toBeDefined();
    expect(schema.subOrderItems.dutyRatePercentage).toBeDefined();
    expect(schema.subOrderItems.taxRatePercentage).toBeDefined();
    expect(schema.subOrderItems.unitPricePaid).toBeDefined();
  });

  it('verifies double-entry ledger accounts enum includes all standard categories', () => {
    expect(schema.accountTypeEnum.enumValues).toEqual(['asset', 'liability', 'equity', 'revenue', 'expense']);
  });
});
