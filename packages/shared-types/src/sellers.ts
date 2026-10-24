export type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface KYCDocument {
  id: string;
  type: 'business_license' | 'passport' | 'tax_registration' | 'bank_statement';
  documentNumber?: string;
  fileUrl: string;
  verified: boolean;
  uploadedAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  businessName: string;
  legalEntityType: string; // 'individual', 'corporation', 'llc'
  taxIdNumber: string;
  countryCode: string; // ISO 3166-1 alpha-2
  stripeConnectedAccountId?: string | null;
  wiseRecipientId?: string | null;
  commissionRate: number; // e.g. 10.00 (%)
  rollingReserveRate: number; // e.g. 10.00 (%)
  rollingReserveDays: number; // e.g. 60
  escrowInspectionDays: number; // e.g. 14
  kycStatus: KYCStatus;
  kycDocuments: KYCDocument[];
  payoutBankDetails?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  sellerId: string;
  warehouseName: string;
  countryCode: string; // ISO 3166-1 alpha-2 (Dispatch Origin)
  stateProvince?: string | null;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string | null;
  phoneContact?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
