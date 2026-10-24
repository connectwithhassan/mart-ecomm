export type LedgerAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface LedgerAccount {
  id: string;
  accountNumber: string; // '1010', '1020', '2010', '2020', '2030', '4010', '5010'
  name: string;
  type: LedgerAccountType;
  currency: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export type JournalReferenceType =
  | 'order_payment'
  | 'escrow_release'
  | 'refund'
  | 'chargeback'
  | 'fee_deduction'
  | 'reserve_release';

export interface LedgerJournalEntry {
  id: string;
  entryNumber: string; // e.g. JE-2026-1024-0001
  referenceType: JournalReferenceType;
  referenceId: string; // sub_order_id, refund_id, etc.
  description: string;
  postedAt: Date;
  createdAt: Date;
}

export interface LedgerJournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  sellerId?: string | null;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  createdAt: Date;
}

export type PayoutStatus = 'scheduled' | 'processing' | 'completed' | 'failed';

export interface SellerPayout {
  id: string;
  payoutBatchId?: string | null;
  sellerId: string;
  amount: number;
  currency: string;
  provider: string; // 'wise', 'stripe_transfer', 'mock_payout'
  providerTransactionId?: string | null;
  status: PayoutStatus;
  failureReason?: string | null;
  scheduledFor: Date;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
