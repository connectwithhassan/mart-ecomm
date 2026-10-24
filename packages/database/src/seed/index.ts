import * as schema from '../schema/index.js';
import type { DatabaseInstance } from '../client.js';

export interface SeedOptions {
  reset?: boolean;
}

export async function runSeed(db: DatabaseInstance, _options: SeedOptions = {}): Promise<void> {
  console.log('🌱 Starting database seed...');

  // 1. Seed Regions
  console.log('📍 Seeding regions...');
  const regionsToInsert = [
    { code: 'US', name: 'United States', defaultCurrency: 'USD', taxEngine: 'stripe_tax' },
    { code: 'EU', name: 'European Union', defaultCurrency: 'EUR', taxEngine: 'stripe_tax' },
    { code: 'UK', name: 'United Kingdom', defaultCurrency: 'GBP', taxEngine: 'stripe_tax' },
    { code: 'GCC', name: 'Gulf Cooperation Council', defaultCurrency: 'AED', taxEngine: 'stripe_tax' },
    { code: 'PK', name: 'Pakistan', defaultCurrency: 'PKR', taxEngine: 'stripe_tax' },
  ];

  for (const r of regionsToInsert) {
    await db.insert(schema.regions).values(r).onConflictDoNothing();
  }

  // 2. Seed Exchange Rates
  console.log('💱 Seeding exchange rates with 1.5% risk buffer...');
  const ratesToInsert = [
    { baseCurrency: 'USD', targetCurrency: 'EUR', marketRate: '0.920000', bufferPercentage: '1.50', effectiveRate: '0.933800' },
    { baseCurrency: 'USD', targetCurrency: 'GBP', marketRate: '0.790000', bufferPercentage: '1.50', effectiveRate: '0.801850' },
    { baseCurrency: 'USD', targetCurrency: 'AED', marketRate: '3.672500', bufferPercentage: '1.50', effectiveRate: '3.727588' },
    { baseCurrency: 'USD', targetCurrency: 'PKR', marketRate: '278.500000', bufferPercentage: '1.50', effectiveRate: '282.677500' },
  ];

  for (const rate of ratesToInsert) {
    await db.insert(schema.exchangeRates).values(rate).onConflictDoNothing();
  }

  // 3. Seed Chart of Accounts
  console.log('📚 Seeding General Ledger Chart of Accounts...');
  const accountsToInsert = [
    { accountNumber: '1010', name: 'Cash in Escrow', type: 'asset' as const, currency: 'USD', description: 'Buyer funds held in escrow' },
    { accountNumber: '1020', name: 'Operating Cash / Bank', type: 'asset' as const, currency: 'USD', description: 'Platform operating account' },
    { accountNumber: '2010', name: 'Seller Payable Escrow', type: 'liability' as const, currency: 'USD', description: 'Pending payout to sellers post-inspection' },
    { accountNumber: '2020', name: 'Seller Rolling Reserve Held', type: 'liability' as const, currency: 'USD', description: '10% rolling reserve held for 60 days' },
    { accountNumber: '2030', name: 'Tax Authority Payable', type: 'liability' as const, currency: 'USD', description: 'Import VAT/GST and duties to remit' },
    { accountNumber: '4010', name: 'Marketplace Commission Revenue', type: 'revenue' as const, currency: 'USD', description: '10% take-rate revenue' },
    { accountNumber: '5010', name: 'Payment Processing Fees', type: 'expense' as const, currency: 'USD', description: 'Gateway processing costs' },
  ];

  for (const acc of accountsToInsert) {
    await db.insert(schema.ledgerAccounts).values(acc).onConflictDoNothing();
  }

  console.log('✅ Baseline seed completed successfully.');
}
