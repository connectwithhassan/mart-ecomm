# Product Requirements Document (PRD)
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Software Architect & Product Lead
- **Target Architecture:** Modular Monolith (Turborepo, Fastify, Next.js, Vite React, PostgreSQL, Redis, BullMQ, Meilisearch)

---

## 1. Executive Summary & Vision

The platform is an enterprise-grade, cross-border multi-vendor marketplace designed to connect international merchants with global consumers. Unlike traditional single-vendor stores or domestic-only marketplaces, this platform solves three fundamental complexities of international commerce:

1. **Delivered Duty Paid (DDP) Transparency:** Real-time calculation of customs tariffs, import VAT/GST, and international freight at checkout, eliminating surprise charges for buyers at destination customs.
2. **Multi-Warehouse Distributed Order Splitting:** Seamless aggregation of items from vendors distributed across different origin countries into a unified shopping cart, followed by deterministic splitting into vendor-specific sub-orders with independent shipping labels, tracking, and carrier manifests.
3. **Auditable Escrow & Double-Entry Financial Settlement:** Legally compliant escrow mechanics holding buyer funds in platform custody until verified carrier delivery and completion of the buyer return window, followed by automated split disbursements, marketplace commission deductions, and rolling risk reserves.

---

## 2. User Personas & Ecosystem Actors

### 2.1 International Customer (Buyer)
- **Profile:** Consumers shopping across borders seeking rare, high-value, or price-advantaged items.
- **Key Needs:**
  - Frictionless localization: Automatic detection of preferred language, currency, and local shipping country.
  - Transparent pricing: Total landing cost (item price + FX buffer + shipping + customs/duties/tax) displayed upfront.
  - Multi-seller consolidated checkout: Single payment transaction even when purchasing items from multiple countries.
  - Unified tracking dashboard: Clear multi-package timeline showing customs clearance and carrier transitions.
  - Dispute & return protection: Accessible return initiation within policy window.

### 2.2 Marketplace Vendor / Seller
- **Profile:** Brand owners, distributors, and manufacturers operating in one or more jurisdictions.
- **Key Needs:**
  - Automated onboarding & KYC: Self-service portal to submit corporate registrations, identity documentation, and payout bank accounts.
  - Multi-warehouse inventory control: Ability to define physical warehouse locations globally and assign real-time stock levels per warehouse.
  - Catalog & cross-border metadata: Product creation with multilingual titles/descriptions, dimensional weights, and Harmonized System (HS) tariff codes.
  - Split-order fulfillment workflow: Dedicated dashboard displaying assigned sub-orders, 1-click generation of Airway Bills (AWB) and Commercial Invoices.
  - Financial transparency: Real-time visibility into escrow holds, released earnings, commission breakdowns, and scheduled payout batches.

### 2.3 Super Admin / Marketplace Operator
- **Profile:** Operations, finance, legal, and catalog managers operating the platform.
- **Key Needs:**
  - Seller verification console: KYC review, business vetting, and risk scoring.
  - Global catalog governance: Category taxonomies, prohibited product enforcement, and HS code validation rules.
  - Financial reconciliation & ledger oversight: Auditable double-entry ledger inspection, dispute mediation, fee structure overrides, and manual payout holds.
  - Regional configuration: Managing supported currencies, target regions, exchange rate margins, and tax engine integrations.

### 2.4 Background Autonomous Agents & Workers
- **Profile:** System background processes scheduled via BullMQ and Redis.
- **Responsibilities:**
  - Daily/hourly FX exchange rate synchronization with buffer adjustments.
  - Automatic release of expired inventory locks from abandoned checkouts.
  - Ingestion and normalization of carrier webhook tracking milestones.
  - Escrow maturation timer triggers and automated Wise/Stripe payout dispatch.

---

## 3. Core Functional Requirements (FR)

### FR-1: International Localization & Regional Routing
- **FR-1.1:** Edge detection of client IP via Cloudflare headers (`CF-IPCountry`) to pre-select default regional storefront, currency, and language.
- **FR-1.2:** Manual override picker in storefront header allowing customer to change delivery country, active currency, and language at any time.
- **FR-1.3:** Currency engine supporting base pricing in USD with dynamic conversion into target currencies (EUR, GBP, AED, SAR, JPY, CAD, AUD, PKR, etc.).
- **FR-1.4:** Application of a configurable Foreign Exchange (FX) risk buffer (default: 1.5% to 2.0%) over mid-market rates to protect against currency slippage during cart-to-settlement lag.
- **FR-1.5:** Multilingual product content stored via `JSONB` schemas supporting seamless locale fallbacks (e.g., requested `ar` $\rightarrow$ fallback `en`).

### FR-2: Vendor Onboarding, KYC & Multi-Warehouse Management
- **FR-2.1:** Vendor registration workflow capturing company name, legal entity structure, tax identification number (EIN, VAT, TRN), and registered country.
- **FR-2.2:** Secure document upload pipeline for business licenses and government IDs stored in private cloud storage with temporary presigned URLs.
- **FR-2.3:** Multi-warehouse management allowing vendors to define unlimited physical inventory hubs with complete postal addresses, ISO country codes, and dispatch cut-off schedules.
- **FR-2.4:** Payout account provisioning capturing IBAN/SWIFT or Stripe Connected Account IDs.

### FR-3: Catalog, SKU Variants & Cross-Border Classification
- **FR-3.1:** Hierarchical product category tree with inheritance of specification attributes.
- **FR-3.2:** Variant generator supporting dimensional attributes (size, color, material) with individual SKU generation.
- **FR-3.3:** Mandatory physical shipping parameters per variant: dead weight (grams) and volumetric dimensions (length, width, height in cm).
- **FR-3.4:** Mandatory 6-to-10 digit Harmonized System (HS) Tariff Code per product/variant for international customs classification.
- **FR-3.5:** Country of Origin (ISO 3166-1 alpha-2) designation per product for trade treaty compliance and preferential duty schedules.

### FR-4: Real-Time Atomic Inventory Reservations
- **FR-4.1:** Multi-warehouse inventory tracking tracking `available_stock` and `reserved_stock`.
- **FR-4.2:** Sub-millisecond distributed stock locking via Redis `SETNX` / Lua scripts during checkout initialization.
- **FR-4.3:** Reservation Time-To-Live (TTL) of 15 minutes. If payment confirmation is not received within 15 minutes, BullMQ worker automatically releases reserved stock back to available stock.
- **FR-4.4:** Check constraint enforcement (`available_stock >= 0`) at the PostgreSQL engine level to guarantee no overselling under race conditions.

### FR-5: Multi-Seller Distributed Cart & Order Splitting Engine
- **FR-5.1:** Cart UI and data structure grouping items dynamically by origin seller and origin warehouse.
- **FR-5.2:** Real-time quotation of multi-carrier shipping rates for each sub-shipment using warehouse origin and customer destination.
- **FR-5.3:** Delivered Duty Paid (DDP) calculation integrating item value, shipping cost, insurance, and HS code tariff rates.
- **FR-5.4:** Parent Order creation capturing total customer charge, currency, applied exchange rate, and unified payment intent.
- **FR-5.5:** Immediate atomic creation of child Sub-Orders within the same PostgreSQL transaction, partitioned by seller and warehouse.
- **FR-5.6:** Itemized `sub_order_items` recording historical unit prices, localized tax amount, customs duty share, and assigned SKU.

### FR-6: Payment Orchestration & Split Escrow Accounting
- **FR-6.1:** Single payment capture via Stripe Elements / Adyen Drop-in. Backend never touches or stores raw PAN, CVV, or cardholder credentials (PCI-DSS SAQ-A compliance).
- **FR-6.2:** Assignment of payment intent to a unified marketplace `transfer_group = parent_order_id`.
- **FR-6.3:** Immediate placement of captured funds into platform escrow custody.
- **FR-6.4:** Carrier delivery webhook trigger initiating a contractual buyer inspection period (default: 14 calendar days).
- **FR-6.5:** Automated post-inspection settlement worker calculating:
  $$\text{Net Payout} = \text{Gross Sub-Order} - \text{Marketplace Commission} - \text{Withheld Taxes} - \text{Rolling Reserve}$$
- **FR-6.6:** Holding of rolling risk reserve (default: 10% of gross sub-order value) in a restricted ledger account for 60 calendar days to cover potential late chargebacks.

### FR-7: Auditable Double-Entry Financial Accounting
- **FR-7.1:** Immutable financial ledger recording all monetary movements as balanced debits and credits across platform Chart of Accounts:
  - Account 1010: Cash in Escrow (Asset)
  - Account 1020: Operating Cash (Asset)
  - Account 2010: Seller Payable Escrow (Liability)
  - Account 2020: Seller Rolling Reserve Held (Liability)
  - Account 2030: Tax Authority Payable (Liability)
  - Account 4010: Marketplace Commission Revenue (Revenue)
  - Account 5010: Gateway Processing Fees (Expense)
- **FR-7.2:** Strict invariant: $\sum \text{Debits} == \sum \text{Credits}$ for every posted journal entry. Zero-balance validation enforced in code and database constraints.
- **FR-7.3:** Prohibition of `UPDATE` or `DELETE` statements on ledger records. Adjustments, refunds, and chargebacks must be posted as new offsetting journal entries.

### FR-8: Logistics, Carrier Automation & Customs Documentation
- **FR-8.1:** Provider-agnostic Carrier Adapter interface with out-of-the-box implementations for EasyPost, Shippo, and Mock Logistics Engine.
- **FR-8.2:** Automated generation of compliant PDF Commercial Invoices displaying Seller Tax ID, Buyer Details, HS Codes, Country of Origin, Declared Value, and Incoterms (DDP).
- **FR-8.3:** Airway Bill (AWB) label generation and storage in Cloudflare R2 / S3 object store.
- **FR-8.4:** Carrier tracking webhook ingestion updating sub-order status through state machine: `pending` $\rightarrow$ `processing` $\rightarrow$ `manifested` $\rightarrow$ `in_transit` $\rightarrow$ `customs_cleared` $\rightarrow$ `out_for_delivery` $\rightarrow$ `delivered`.

---

## 4. Non-Functional Requirements (NFR)

### NFR-1: Performance & Latency
- Fastify API p95 response time $< 150\text{ ms}$ for standard transactional endpoints.
- Meilisearch search query p95 response time $< 25\text{ ms}$ for catalog lookups.
- Next.js storefront Core Web Vitals: LCP $< 2.0\text{ s}$, FID $< 100\text{ ms}$, CLS $< 0.1$.

### NFR-2: High Availability & Fault Tolerance
- Zero single point of failure in transaction path.
- PostgreSQL automated connection pooling via `pgbouncer` or Fastify plugin pool management.
- BullMQ Redis queue persistence with exponential backoff retries and dead-letter queues (DLQ) for failed webhooks or payout calls.

### NFR-3: Security, Privacy & Tenancy
- Zero storage of raw credit card data.
- Strict tenant isolation: Vendors can only access their own warehouses, products, sub-orders, and ledger entries.
- Server-side JWT signature verification with cryptographic RS256/EdDSA or hardened HMAC-SHA256.
- Comprehensive audit trail for Super Admin actions (KYC approvals, manual payout releases).
- GDPR & CCPA compliance: Right to be forgotten, data portability export, cookie consent management.

---

## 5. Scope Boundaries

| In Scope (Baseline & Phased Roadmap) | Out of Scope (Phase 1 Initial Release) |
| :--- | :--- |
| Multi-vendor cart & split checkout | Platform-owned physical fulfillment centers (3PL / FBA-style) |
| DDP duty & tax calculation | Real-time live video commerce / streaming |
| Stripe Connect payment capture & split escrow | Native iOS / Android apps (covered via responsive PWA first) |
| Mock carrier & tax adapters for local development | Custom hardware POS terminals |
| Double-entry financial ledger | Direct crypto payments (BTC/USDC) |
| Meilisearch faceted product search | Complex consumer auction / bidding mechanics |
| Seller Center & Super Admin Portals | Multi-tenant SaaS white-labeling of the entire platform |
