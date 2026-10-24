# Integration Register & External Adapters
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Software Architect & Senior Integration Engineer

---

## 1. Third-Party Integrations Summary

| Provider | Category | Purpose | Local Dev Mode | Production Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe Connect** | Payments & Escrow | Single checkout payment capture, `transfer_group` grouping, escrow custody, localized credit card/digital wallets | `MockPaymentAdapter` | `StripeConnectAdapter` |
| **Stripe Tax / Avalara** | Tax & Customs | Automated Delivered Duty Paid (DDP) calculation, import VAT, sales tax, HS Code tariff rules | `MockTaxAdapter` | `StripeTaxAdapter` |
| **EasyPost / Shippo** | Logistics & Carriers | Multi-carrier shipping rates (DHL, FedEx, UPS, Aramex), AWB label generation, customs declarations | `MockLogisticsAdapter` | `EasyPostAdapter` |
| **Wise Platform** | International Payouts | Batch cross-border seller bank disbursements, multi-currency conversion, IBAN/SWIFT validation | `MockPayoutAdapter` | `WisePlatformAdapter` |
| **Meilisearch** | Search & Discovery | Fast typo-tolerant faceted product search, multilingual indexing, instant filter aggregations | Local Meilisearch Docker Container | Dedicated Cloud Cluster |
| **Cloudflare** | Edge, CDN & Storage | GeoIP location header (`CF-IPCountry`), DDoS/WAF protection, Cloudflare R2 object store for invoices and labels | Local File Mock / S3 Mock | Cloudflare CDN & R2 Storage |

---

## 2. Detailed Provider Specifications & Adapter Contracts

### 2.1 Payment Gateway Adapter (`PaymentGatewayAdapter`)

#### TypeScript Interface Contract:
```typescript
export interface CreatePaymentIntentParams {
  amount: number; // In smallest currency unit (e.g. cents)
  currency: string; // ISO 3-letter (e.g. 'eur', 'usd')
  transferGroup: string; // parent_order_id
  metadata: {
    parentOrderId: string;
    customerId: string;
    subOrderCount: number;
  };
}

export interface PaymentIntentResult {
  intentId: string;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded';
}

export interface PaymentGatewayAdapter {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  capturePayment(intentId: string): Promise<boolean>;
  refundPayment(intentId: string, amount: number, reason?: string): Promise<boolean>;
  verifyWebhookSignature(rawPayload: Buffer, signatureHeader: string): boolean;
}
```

#### Mock vs. Production Behavior:
- **`MockPaymentAdapter`:**
  - Generates deterministic IDs: `pi_mock_` + UUID.
  - Generates mock client secrets for local UI testing.
  - In-memory event dispatcher to simulate instant payment success or simulated card declines for test scenarios.
  - Zero network calls; no external credentials required.
- **`StripeConnectAdapter`:**
  - Uses official `stripe` SDK with secret API key (`STRIPE_SECRET_KEY`).
  - Supports Apple Pay, Google Pay, and localized European payment methods (iDEAL, Sofort, Bancontact) through Stripe Elements.
  - Verifies raw webhook bytes using `stripe.webhooks.constructEvent()`.

---

### 2.2 Tax & Customs DDP Adapter (`TaxEngineAdapter`)

#### TypeScript Interface Contract:
```typescript
export interface TaxCalculationParams {
  destinationCountry: string; // ISO 2-letter
  destinationPostalCode: string;
  originCountry: string; // Warehouse origin country
  items: Array<{
    variantId: string;
    sku: string;
    hsCode: string; // 6-10 digit tariff code
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  shippingCost: number;
}

export interface TaxCalculationResult {
  customsDutyAmount: number;
  vatGstAmount: number;
  totalTaxAndDuty: number;
  effectiveTaxRate: number;
  incoterm: 'DDP';
}

export interface TaxEngineAdapter {
  calculateDdp(params: TaxCalculationParams): Promise<TaxCalculationResult>;
}
```

#### Mock vs. Production Behavior:
- **`MockTaxAdapter`:**
  - Applies deterministic rules based on destination:
    - US $\rightarrow$ EU: 4.5% customs duty + 19% VAT (standard German rate benchmark).
    - US $\rightarrow$ UK: 5.0% customs duty + 20% VAT.
    - US $\rightarrow$ GCC: 5.0% customs duty + 5% VAT.
    - Domestic US $\rightarrow$ US: 0% customs duty + 7.5% estimated state tax.
- **`StripeTaxAdapter` / `AvalaraAdapter`:**
  - Submits SKU HS Codes to live tax engines for accurate landed cost calculations considering bilateral free trade agreements and de minimis thresholds.

---

### 2.3 Logistics & Carrier Adapter (`LogisticsCarrierAdapter`)

#### TypeScript Interface Contract:
```typescript
export interface ParcelDimensions {
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface AddressInfo {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string; // ISO 2-letter
  phone?: string;
}

export interface CarrierRateQuote {
  carrier: string; // 'DHL Express', 'FedEx International', 'UPS Worldwide'
  serviceCode: string;
  rateAmount: number;
  currency: string;
  estimatedTransitDays: number;
}

export interface ShipmentManifestResult {
  trackingNumber: string;
  carrierName: string;
  labelUrl: string; // PDF AWB label
  commercialInvoiceUrl: string; // PDF customs commercial invoice
  customsDeclarationId: string;
}

export interface LogisticsCarrierAdapter {
  getRates(from: AddressInfo, to: AddressInfo, parcel: ParcelDimensions): Promise<CarrierRateQuote[]>;
  createShipment(
    subOrderNumber: string, 
    from: AddressInfo, 
    to: AddressInfo, 
    parcel: ParcelDimensions, 
    customsItems: Array<{ hsCode: string; description: string; value: number; countryOfOrigin: string }>
  ): Promise<ShipmentManifestResult>;
}
```

#### Mock vs. Production Behavior:
- **`MockLogisticsAdapter`:**
  - Generates realistic tracking codes (`DHL-MOCK-987654`, `FEDEX-MOCK-123456`).
  - Generates dynamic vector-drawn PDF labels and Commercial Invoices containing exact order data, barcodes, and customs stamps.
  - Provides a mock tracking endpoint to artificially advance parcel status (`shipped` $\rightarrow$ `customs_cleared` $\rightarrow$ `delivered`) for E2E flow testing.
- **`EasyPostAdapter`:**
  - Connects to EasyPost REST API. Generates official multi-carrier ZPL/PDF shipping labels and handles electronic customs document transmission (ETD).

---

### 2.4 International Payout Adapter (`PayoutGatewayAdapter`)

#### TypeScript Interface Contract:
```typescript
export interface PayoutRecipient {
  sellerId: string;
  accountHolderName: string;
  countryCode: string;
  currency: string;
  bankDetails: {
    iban?: string;
    bicSwift?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
}

export interface PayoutBatchItem {
  payoutId: string;
  sellerId: string;
  recipientId: string;
  amount: number;
  currency: string;
  referenceText: string; // e.g. "Payout SO-2026-1024-8901"
}

export interface PayoutBatchResult {
  batchId: string;
  status: 'submitted' | 'processing' | 'completed';
  itemCount: number;
  totalDisbursed: number;
}

export interface PayoutGatewayAdapter {
  registerRecipient(recipient: PayoutRecipient): Promise<string>; // Returns recipientId
  submitBatchPayout(items: PayoutBatchItem[]): Promise<PayoutBatchResult>;
}
```

#### Mock vs. Production Behavior:
- **`MockPayoutAdapter`:**
  - Simulates recipient registration and records batch transfers in memory and `seller_payouts` table without executing actual bank transactions.
- **`WisePlatformAdapter`:**
  - Leverages the Wise Platform API to initiate domestic local-clearing bank transfers in 70+ countries at mid-market rates.

---

## 3. Environment Variable Configuration Matrix

All integrations are toggled and configured strictly via environment variables parsed and validated via Zod on application startup:

```bash
# Gateway Selection Flags (mock | live)
PAYMENT_ADAPTER=mock         # 'mock' | 'stripe'
TAX_ADAPTER=mock             # 'mock' | 'stripe_tax' | 'avalara'
LOGISTICS_ADAPTER=mock       # 'mock' | 'easypost'
PAYOUT_ADAPTER=mock          # 'mock' | 'wise'

# Live Credentials (Required only when ADAPTER != mock)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EASYPOST_API_KEY=EZTK...
WISE_API_KEY=...
WISE_PROFILE_ID=...
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey123
```
