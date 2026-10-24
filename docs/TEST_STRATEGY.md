# Quality Assurance & Test Strategy
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** QA Lead & Senior Full-Stack Engineer
- **Core Test Frameworks:** Vitest (Unit & Integration), Playwright (E2E), Autocannon / k6 (Concurrency & Load)

---

## 1. Testing Pyramid & Verification Framework

The platform enforces a multi-layered quality assurance matrix designed to catch defects before code reaches staging or production.

```text
               ▲
              / \
             /   \      E2E Tests (Playwright)
            /     \     - Storefront checkout journey
           /  E2E  \    - Seller fulfillment & AWB generation
          /─────────\   - Super Admin ledger audit
         /           \
        / Concurrency \  Stress & Race Condition Tests (Autocannon / k6)
       /   & Stress    \ - 100 concurrent requests on 1 SKU
      /─────────────────\ - Webhook replay & duplicate delivery
     /                   \
    /     Integration     \ Integration & Database Tests (Vitest + Testcontainers)
   /      & Contract       \ - Order splitting & SQL transactions
  /─────────────────────────\ - Double-entry ledger invariants
 /                           \
/         Unit Tests          \ Unit Tests (Vitest)
─────────────────────────────── - DDP tax calculations, currency conversions, schema validations
```

---

## 2. Critical Test Suites & Invariant Verifications

### 2.1 Concurrency & Inventory Race Condition Test
- **Objective:** Prove that when 100 concurrent customer sessions attempt to purchase the final unit of stock (`available_stock = 1`), exactly 1 order succeeds, 99 fail with a clean 409 Conflict, and `available_stock` never drops below 0.
- **Harness:** Fastify injected requests via `Promise.all()` hitting `/api/v1/checkout`.
- **Assertion:**
  - Success HTTP 201 count: Exactly 1.
  - Failure HTTP 409 count: Exactly 99.
  - Final database state: `available_stock == 0`, `reserved_stock == 1`.
  - Zero deadlocks or unhandled SQL transaction rollbacks.

### 2.2 Multi-Seller Split-Order & DDP Calculation Test
- **Objective:** Verify that a cart with 3 items originating from 2 different sellers across 2 different countries (e.g. US and JP) being shipped to Germany correctly computes:
  - Parent order total matching sum of sub-orders.
  - Distinct sub-orders created for Seller A (US) and Seller B (JP).
  - Itemized `sub_order_items` preserving origin country, HS codes, and calculated VAT/duties.
  - Frozen exchange rate applied accurately with 1.5% buffer.

### 2.3 Double-Entry Financial Accounting Invariant Test
- **Objective:** Verify the mathematical and structural integrity of the General Ledger under all transaction lifecycles.
- **Invariant Assertions:**
  1. **Zero-Balance Invariant:**
     $$\sum \text{Debit Amounts} - \sum \text{Credit Amounts} \equiv 0.0000$$
     Verified on every single `ledger_journal_entry`.
  2. **Payment Ingestion Journal:**
     - Debit `1010: Cash in Escrow` (Gross)
     - Credit `2010: Seller Payable Escrow` (Net)
     - Credit `4010: Marketplace Commission Revenue` (Platform take)
     - Credit `2030: Tax Authority Payable` (Withheld tax)
  3. **Escrow Maturity Release Journal:**
     - Debit `2010: Seller Payable Escrow`
     - Credit `2020: Seller Rolling Reserve Held` (10%)
     - Credit `1020: Operating Cash / Bank` (90% disbursed)
  4. **Refund Reversal Journal:**
     - Reverses original lines without modifying the original historical journal entry.

### 2.4 Webhook Idempotency & Replay Attack Test
- **Objective:** Verify resilience against duplicate or out-of-order webhook delivery.
- **Methodology:**
  1. Generate mock Stripe `payment_intent.succeeded` event with `event_id = evt_test_12345`.
  2. Send 5 simultaneous requests to `/api/v1/webhooks/stripe`.
  3. Verify that only 1 request triggers order state transition and ledger posting; remaining 4 return cached `200 OK`.
  4. Verify no duplicate sub-orders or duplicate journal entries exist in PostgreSQL.

### 2.5 Mock Adapter Contract Verification
- **Objective:** Ensure Mock Adapters (`MockPaymentAdapter`, `MockLogisticsAdapter`, `MockTaxAdapter`, `MockPayoutAdapter`) strictly conform to production TypeScript interfaces.
- **Test Coverage:**
  - Mock payment intent creation, capture, and simulated card failure modes.
  - Mock carrier rate quoting, AWB label generation (mock PDF), and tracking status progression.
  - Mock Wise batch payout generation and failure simulation.

---

## 3. End-to-End (E2E) Acceptance Journeys (Playwright)

| Test ID | User Journey | Key Validations |
| :--- | :--- | :--- |
| **E2E-01** | International Customer Checkout | Select country/currency $\rightarrow$ Add 2 items from 2 sellers $\rightarrow$ View DDP breakdown $\rightarrow$ Enter address $\rightarrow$ Submit payment (mock Stripe) $\rightarrow$ View Parent Order summary with 2 tracking links. |
| **E2E-02** | Seller Onboarding & Fulfillment | Register vendor $\rightarrow$ Upload mock KYC license $\rightarrow$ View assigned sub-order $\rightarrow$ Click "Generate AWB & Invoice" $\rightarrow$ Verify PDF downloads $\rightarrow$ Sub-order transitions to `manifested`. |
| **E2E-03** | Super Admin Ledger & KYC Approval | Admin logs in $\rightarrow$ Reviews pending KYC docs $\rightarrow$ Approves vendor $\rightarrow$ Navigates to Financial Ledger $\rightarrow$ Inspects balanced journal entries $\rightarrow$ Verifies escrow hold countdown. |

---

## 4. Test Execution Commands & CI Pipeline

```bash
# 1. Run all Unit & Schema Validation Tests
pnpm --filter @marketplace/database test
pnpm --filter @marketplace/api test:unit

# 2. Run Database Integration & Invariant Tests (requires local PG & Redis)
pnpm --filter @marketplace/api test:integration

# 3. Run Concurrency & Race Condition Test Suite
pnpm --filter @marketplace/api test:concurrency

# 4. Run Playwright End-to-End Test Suite
pnpm --filter @marketplace/storefront test:e2e
pnpm --filter @marketplace/seller-portal test:e2e
```
