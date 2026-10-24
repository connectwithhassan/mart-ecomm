# Implementation Roadmap & Micro-Task Breakdown
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Software Architect & QA Lead

---

## 1. Roadmap Overview & Milestones

The implementation is broken down into ordered, testable phases. No phase begins until the preceding phase meets its formal acceptance criteria and test coverage invariants.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASED IMPLEMENTATION PIPELINE                    │
└────────────────────────────────────────────────────────────────────────┘
  Phase 0: Workspace Foundation & Tooling Architecture (Turborepo/pnpm)
     │
  Phase 1: Multi-Tenant Database Schema, Drizzle ORM & Local Infraj
     │
  Phase 2: Authentication, RBAC & Dynamic Regional Localization
     │
  Phase 3: Vendor KYC, Multi-Warehouses, Catalog & Atomic Inventory Locks
     │
  Phase 4: Distributed Multi-Seller Cart, DDP Tax Engine & Split Orders
     │
  Phase 5: Payment Gateway Tokenization, Webhooks & Escrow Ingestion
     │
  Phase 6: Carrier Adapters, AWB Label Generation & Customs Documentation
     │
  Phase 7: Double-Entry General Ledger, Escrow Release & Batch Payouts
     │
  Phase 8: International Storefront (Next.js) & Portal SPAs (Vite/React)
     │
  Phase 9: Concurrency Stress Benchmarks, E2E Auditing & Hardening
```

---

## 2. Micro-Task Breakdown & Acceptance Criteria

### Phase 0: Workspace Foundation & Tooling Architecture

#### Task 0.1: Monorepo Scaffolding & Tooling Setup
- **Dependencies:** None.
- **Actions:**
  - Initialize Git repository and `.gitignore`.
  - Configure `pnpm-workspace.yaml` and root `package.json`.
  - Configure `turbo.json` with build, test, lint, and dev pipeline tasks.
  - Setup shared packages: `@marketplace/tsconfig`, `@marketplace/eslint-config`, `@marketplace/shared-types`.
- **Acceptance Criteria:** `pnpm install` succeeds across all workspace packages with zero cyclic dependencies.
- **Test Command:** `pnpm turbo run lint` passes across root and shared packages.
- **Completion Evidence:** Clean Turborepo pipeline execution logs.

#### Task 0.2: Fastify Backend Skeleton (`apps/api`)
- **Dependencies:** Task 0.1.
- **Actions:**
  - Bootstrap Fastify v4/v5 application with `@fastify/sensible`, `@fastify/cors`, `@fastify/helmet`.
  - Implement Zod-based environment variable validation (`src/config/env.ts`).
  - Configure `@fastify/swagger` and `@fastify/swagger-ui` at `/docs`.
  - Configure global RFC 7807 problem details error handler.
- **Acceptance Criteria:** Fastify starts on port 4000, responds `200 OK` on `/health`, and generates OpenAPI JSON.
- **Test Command:** `pnpm --filter @marketplace/api test:unit`.

#### Task 0.3: Next.js & Vite Portals Baseline
- **Dependencies:** Task 0.1.
- **Actions:**
  - Bootstrap `apps/storefront` (Next.js 14 App Router, Tailwind CSS).
  - Bootstrap `apps/seller-portal` (Vite, React, Tailwind CSS).
  - Bootstrap `apps/admin-portal` (Vite, React, Tailwind CSS).
  - Configure Tailwind with unified `@marketplace/design-tokens`.
- **Acceptance Criteria:** All three applications start in dev mode without build errors.

---

### Phase 1: Database Schema, Drizzle ORM & Infrastructure

#### Task 1.1: Local Docker Infrastructure (`docker-compose.yml`)
- **Dependencies:** Task 0.1.
- **Actions:**
  - Compose file for PostgreSQL 15+, Redis 7 (alpine), and Meilisearch v1.6+.
  - Persistent volume mounts, health checks, and connection credentials.
- **Acceptance Criteria:** `docker compose up -d` successfully launches all 3 services and reports healthy status.

#### Task 1.2: Drizzle ORM Schema Definitions (`packages/database`)
- **Dependencies:** Task 1.1.
- **Actions:**
  - Implement full schema in `packages/database/src/schema/`:
    - `users.ts`, `regions.ts`, `sellers.ts`, `warehouses.ts`
    - `products.ts`, `variants.ts`, `inventory.ts`
    - `parent_orders.ts`, `sub_orders.ts`, `sub_order_items.ts`
    - `ledger.ts` (accounts, journal entries, journal lines, payouts)
    - `shipments.ts`, `webhooks.ts`
  - Setup Drizzle migration generator and PostgreSQL connection pool.
- **Acceptance Criteria:** Drizzle migrates schema successfully into PostgreSQL without SQL syntax errors.
- **Test Command:** `pnpm --filter @marketplace/database db:migrate`.

#### Task 1.3: Database Seed Suite
- **Dependencies:** Task 1.2.
- **Actions:**
  - Create seed script populating:
    - 5 global regions (US, EU, UK, GCC, PK) with base currencies.
    - Standard Chart of Accounts (1010, 1020, 2010, 2020, 2030, 4010, 5010).
    - 1 Super Admin user, 3 International Sellers with physical warehouses (US, JP, DE).
    - 10 sample products with variants, dimensions, and real HS codes.
- **Acceptance Criteria:** `pnpm --filter @marketplace/database db:seed` runs cleanly and passes verification queries.

---

### Phase 2: Authentication, RBAC & Dynamic Regional Localization

#### Task 2.1: Authentication & RBAC Engine
- **Dependencies:** Task 1.3.
- **Actions:**
  - Implement password hashing using `argon2` / `bcrypt`.
  - Implement JWT token signing and verification plugin (`@fastify/jwt`).
  - PreHandler RBAC hooks: `requireAuth`, `requireRole('seller')`, `requireRole('super_admin')`.
- **Acceptance Criteria:** Role matrix tests verify customers cannot call seller routes; sellers cannot call admin routes.
- **Test Command:** `pnpm --filter @marketplace/api test:unit --grep auth`.

#### Task 2.2: Currency Engine & Foreign Exchange Buffer
- **Dependencies:** Task 1.2.
- **Actions:**
  - Exchange rate caching in Redis with 1-hour TTL.
  - Implement rate conversion formula applying 1.5% slippage buffer.
  - Endpoints: `GET /api/v1/regions` and `GET /api/v1/regions/exchange-rates`.
- **Acceptance Criteria:** Converted amounts match formula with correct rounding to 2 decimal places.

---

### Phase 3: Vendor Onboarding, Warehouses, Catalog & Inventory Locks

#### Task 3.1: Seller Center Onboarding & Multi-Warehouse Management
- **Dependencies:** Task 2.1.
- **Actions:**
  - KYC submission endpoint: `POST /api/v1/seller/onboarding`.
  - Warehouse CRUD: `POST /api/v1/seller/warehouses`, `GET /api/v1/seller/warehouses`.
  - Enforcement of strict tenant isolation on all warehouse and seller queries.
- **Acceptance Criteria:** Seller cannot read or modify another seller's warehouse.

#### Task 3.2: Catalog & SKU Variant Engine
- **Dependencies:** Task 3.1.
- **Actions:**
  - Category tree endpoints.
  - Product creation with mandatory HS Code, origin country, weight, and dimensions.
  - Variant generation with unique SKU constraints.
- **Acceptance Criteria:** Creating duplicate SKU returns `409 Conflict`. Missing HS code returns `400 Bad Request`.

#### Task 3.3: Atomic Inventory Reservation Engine (Redis + PostgreSQL)
- **Dependencies:** Task 1.2, Task 3.2.
- **Actions:**
  - Implement distributed lock service using Redis `SETNX` and Lua script.
  - Transactional inventory reservation: Decrement `available_stock`, increment `reserved_stock`.
  - 15-minute TTL delayed job in BullMQ to release abandoned reservations.
- **Acceptance Criteria:** Simultaneous checkout on 1 item yields 1 reservation and rejects remainder.
- **Test Command:** `pnpm --filter @marketplace/api test:concurrency`.

---

### Phase 4: Multi-Seller Cart, DDP Tax & Split Orders

#### Task 4.1: Cart & Multi-Seller Origin Grouper
- **Dependencies:** Task 3.2.
- **Actions:**
  - Cart valuation service grouping line items by `(seller_id, warehouse_id)`.
  - Weight and volumetric package calculation per shipment split.

#### Task 4.2: DDP Duty & Tax Calculation Engine (Mock & Stripe Tax Adapter)
- **Dependencies:** Task 4.1.
- **Actions:**
  - DDP evaluation service calculating destination tariffs based on HS Code and destination country.
  - MockTaxAdapter simulating realistic EU VAT (19-21%), UK VAT (20%), US State Tax (6-9%).
- **Acceptance Criteria:** Returned quote includes transparent duty and VAT breakdown per sub-order.

#### Task 4.3: Split-Order Transactional Creation
- **Dependencies:** Task 3.3, Task 4.2.
- **Actions:**
  - `POST /api/v1/checkout` endpoint.
  - Atomically creates `parent_orders`, $N$ `sub_orders`, and itemized `sub_order_items` in a single SQL transaction.
  - Freezes applied exchange rate on parent order.
- **Acceptance Criteria:** Complete order graph persisted with matching financial totals.

---

### Phase 5: Payment Orchestration, Webhooks & Escrow Ingestion

#### Task 5.1: Payment Gateway Adapter & PaymentIntent Creation
- **Dependencies:** Task 4.3.
- **Actions:**
  - Define `PaymentGatewayAdapter` interface.
  - Implement `MockPaymentAdapter` (local/testing) and `StripeConnectAdapter`.
  - Attach `transfer_group = parent_order_id` to payment intent.

#### Task 5.2: Webhook Listener & Idempotency Filter
- **Dependencies:** Task 5.1.
- **Actions:**
  - `POST /api/v1/webhooks/stripe` raw body listener.
  - Verification of webhook signatures.
  - Record and deduplicate events in `webhook_events` table.
- **Acceptance Criteria:** Replayed webhooks return immediate `200 OK` without duplicate state changes.

---

### Phase 6: Cross-Border Logistics & Customs Documentation

#### Task 6.1: Carrier Adapter Interface & Mock Carrier Engine
- **Dependencies:** Task 5.2.
- **Actions:**
  - Implement `CarrierAdapter` interface with `MockCarrierAdapter` and `EasyPostAdapter`.
  - Carrier rate fetching for DHL Express, FedEx, UPS, Aramex.

#### Task 6.2: AWB Label & Commercial Invoice PDF Generator
- **Dependencies:** Task 6.1.
- **Actions:**
  - PDF generation service producing compliant international Commercial Invoices with Incoterms 2020 DDP.
  - Generation of mock Airway Bill (AWB) shipping labels.
  - Upload to Cloudflare R2 / S3 mock storage.
- **Acceptance Criteria:** Generated PDF contains seller tax ID, buyer details, itemized HS codes, and customs totals.

---

### Phase 7: Double-Entry Escrow Ledger & Batch Settlements

#### Task 7.1: Double-Entry Ledger Core Engine
- **Dependencies:** Task 1.2, Task 5.2.
- **Actions:**
  - Posting service creating balanced `ledger_journal_entries` and `ledger_journal_lines`.
  - Debit/Credit zero-sum validation before SQL commit.
  - Support for `order_payment`, `escrow_release`, `refund`, and `chargeback`.
- **Acceptance Criteria:** Any unbalanced journal entry throws runtime exception and aborts transaction.

#### Task 7.2: Escrow Inspection Timer & Rolling Reserve Worker
- **Dependencies:** Task 7.1, Task 6.1.
- **Actions:**
  - Carrier `delivered` webhook schedules BullMQ delayed job for 14 calendar days.
  - Maturity worker verifies no open disputes, releases net vendor funds, and holds 10% rolling reserve for 60 days.
  - Wise Platform mock payout dispatcher.
- **Acceptance Criteria:** Seller payout record generated with net payable matching ledger balance.

---

### Phase 8: Storefront & Portals UI Implementation

#### Task 8.1: Next.js International Storefront
- **Dependencies:** Phase 4, Phase 5.
- **Actions:**
  - Implement localized layout, currency picker, product catalog with Meilisearch.
  - Cart drawer with multi-seller warehouse grouping.
  - DDP checkout flow with Stripe Elements iframe integration.
  - Adherence to `ui-ux-pro-max` (Rubik/Nunito Sans, `#059669`/`#EA580C`, accessible forms).

#### Task 8.2: React + Vite Seller Center SPA
- **Dependencies:** Phase 3, Phase 6, Phase 7.
- **Actions:**
  - Vendor onboarding KYC wizard.
  - Multi-warehouse inventory manager.
  - Sub-order fulfillment dashboard with 1-click AWB & Invoice PDF download.
  - High-density telemetry and financial earnings table (Fira Code/Sans, `#0F172A`/`#22C55E`).

#### Task 8.3: React + Vite Super Admin Platform SPA
- **Dependencies:** Phase 2, Phase 7.
- **Actions:**
  - KYC review and approval console.
  - Double-entry ledger audit table with debit/credit balance viewer.
  - Dispute management and manual payout hold toggles.

---

### Phase 9: Concurrency Stress Benchmarks & Quality Verification

#### Task 9.1: Concurrency Load Tests (Autocannon / k6)
- **Dependencies:** Phase 8.
- **Actions:**
  - Execute 100 concurrent checkout requests against 1 unit of stock.
  - Benchmark API gateway p95 latency under 1,000 req/sec.
- **Acceptance Criteria:** Zero overselling, zero deadlocks, p95 latency $< 150\text{ ms}$.

#### Task 9.2: End-to-End Playwright Automation
- **Dependencies:** Task 9.1.
- **Actions:**
  - Execute full E2E test suite across Storefront, Seller Center, and Admin Platform.
- **Acceptance Criteria:** 100% green runs on all critical acceptance paths.
