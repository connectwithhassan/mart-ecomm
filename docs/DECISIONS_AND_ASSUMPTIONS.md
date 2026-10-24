# Architectural Decisions & Business Assumptions
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Software Architect

---

## 1. Architectural Decision Records (ADRs)

### ADR-001: Selection of Fastify (TypeScript) over Express
- **Context:** The marketplace backend requires high throughput for flash sales, low event-loop latency, and strict payload validation for financial operations and international checkouts.
- **Decision:** Use Fastify with native Ajv JSON schema compilation.
- **Consequences:**
  - Fastify yields 2-3x higher requests-per-second compared to Express.
  - Native schema compilation via Ajv ensures that requests violating data contracts fail before touching business services.
  - Built-in encapsulation plugin model isolates module dependencies cleanly.

### ADR-002: Resolution of ORM in Favor of Drizzle ORM over Prisma
- **Context:** The baseline specification mentions `(Prisma / Drizzle)`. We must select one to avoid architectural schizophrenia and runtime overhead.
- **Decision:** Select **Drizzle ORM** exclusively.
- **Rationale:**
  - Drizzle generates near-zero runtime abstraction overhead and avoids the heavy binary query engine that Prisma bundles.
  - Complete SQL dialect alignment with PostgreSQL, enabling optimal use of JSONB operators, generated columns, and granular SQL transaction locks (`SELECT ... FOR UPDATE`).
  - Native TypeScript types inferred directly from database schema definitions.

### ADR-003: True Double-Entry General Ledger over Flat Balance Column
- **Context:** The baseline specification included a flat `seller_ledger` table with columns like `gross_amount`, `marketplace_commission`, and `net_payable_amount`. In enterprise financial systems, flat single-row balance records are vulnerable to race conditions, cannot be audited by certified accountants, and fail international regulatory audits.
- **Decision:** Implement a true **Double-Entry General Ledger** with `ledger_accounts`, `ledger_journal_entries`, and `ledger_journal_lines`.
- **Consequences:**
  - Mathematical integrity guaranteed by the zero-sum invariant ($\sum \text{Debits} == \sum \text{Credits}$).
  - Immutable audit trail: Adjustments, refunds, and chargebacks are recorded as new balancing journal entries, prohibiting destructive `UPDATE` or `DELETE` statements.
  - Certified compliance with standard accounting principles (GAAP / IFRS).

### ADR-004: Redis Distributed Locks (`SETNX`) for Inventory Concurrency
- **Context:** During flash sales, thousands of users may attempt to checkout the same low-stock variant simultaneously. Pure database-level locking (`SELECT FOR UPDATE`) causes database connection pool saturation and high transaction abort rates.
- **Decision:** Use a two-tier inventory guard: Fast Redis `SETNX` distributed locks for sub-millisecond checkout reservations, backed by a PostgreSQL database check constraint (`available_stock >= 0`).
- **Consequences:**
  - Rapid rejection of requests when stock is depleted without placing load on the primary relational database.
  - Redis reservations carry a 15-minute TTL; abandoned carts are automatically released back to stock by a BullMQ background worker.

### ADR-005: Provider Adapter Pattern with Local Mock Implementations
- **Context:** International commerce relies heavily on external APIs (Stripe Connect, Stripe Tax, Avalara, EasyPost, Shippo, Wise Platform). Directly coupling business logic to live vendor SDKs breaks automated testing, incurs API costs, and risks accidental charges or unauthorized foreign payouts during development.
- **Decision:** Wrap every third-party integration in an abstract TypeScript interface and provide first-class `MockAdapter` implementations alongside production adapters.
- **Consequences:**
  - The entire test suite and local environment run 100% offline, deterministically, and cost-free.
  - Production enablement requires only setting environment flags (`PAYMENT_PROVIDER=stripe`, `CARRIER_PROVIDER=easypost`) without altering core business workflows.

### ADR-006: Monorepo Architecture with Turborepo & pnpm Workspaces
- **Context:** The platform consists of 4 deployable applications (`api`, `storefront`, `seller-portal`, `admin-portal`) and multiple shared domain libraries (`database`, `shared-types`, `design-tokens`).
- **Decision:** Standardize on Turborepo with pnpm workspaces.
- **Consequences:**
  - Single source of truth for TypeScript types, ensuring frontend and backend contracts never drift out of sync.
  - Intelligent build caching reduces CI/CD execution time by up to 70%.
  - Centralized dependency governance preventing duplicate package versions.

---

## 2. Business Assumptions & Proposed Defaults

The following defaults are established as platform baseline configurations. They can be modified by the Super Admin via configuration tables:

| Parameter | Proposed Default | Business Justification |
| :--- | :--- | :--- |
| **Marketplace Take-Rate** | **10.00%** | Standard international marketplace commission covering platform operations, edge hosting, and basic support. |
| **Rolling Reserve Rate** | **10.00%** | Withheld from vendor net earnings to cover potential late credit card chargebacks and claims. |
| **Rolling Reserve Hold Period** | **60 Calendar Days** | Standard international card scheme chargeback exposure window. Released automatically to seller balance on day 61. |
| **Escrow Inspection / Return Window** | **14 Calendar Days** | Begins when shipping carrier marks parcel as `delivered`. If no return or dispute is lodged within 14 days, funds mature for payout. |
| **Foreign Exchange (FX) Risk Buffer** | **1.50%** | Added on top of mid-market exchange rates to protect the marketplace from foreign currency fluctuations between cart addition and payment capture. |
| **Stock Reservation TTL** | **15 Minutes** | Time granted to the customer to complete payment before reserved inventory is returned to available stock. |
| **Customs Valuation Incoterm** | **DDP (Delivered Duty Paid)** | All international parcels are shipped DDP so the customer experiences zero customs surprises or handling fee demands at their doorstep. |
| **Pilot International Corridor** | **US $\leftrightarrow$ UK / EU / UAE** | Initial focus corridors featuring mature cross-border e-commerce regulations, reliable DHL/FedEx routing, and transparent tax structures (IOSS/VAT). |

---

## 3. Open Business Decisions & Clarification Matrix

The following strategic questions do not block foundational scaffolding, but should be confirmed prior to live production deployment:

1. **Merchant of Record (MoR) Legal Entity:**
   - *Question:* Is the marketplace operator acting as the legal Merchant of Record (MoR) collecting all consumer funds and remitting local VAT/GST under marketplace facilitator laws, or is each vendor the MoR utilizing Stripe Connect Custom Accounts with direct charge liability?
   - *Proposed Default:* **Marketplace as Merchant of Record (Platform MoR)** utilizing Escrow custody, as this provides maximum consumer trust and simplified single-transaction checkout across multi-seller carts.
2. **Returns & Return Freight Responsibility:**
   - *Question:* In the event of buyer remorse returns (within 14 days), who bears the cost of international return freight—the buyer, the vendor, or the platform?
   - *Proposed Default:* Vendor defect/misrepresentation returns are paid by the vendor; buyer remorse returns deduct return shipping cost from the customer refund.
3. **Cross-Border Payout Currency Matching:**
   - *Question:* Should international sellers be disbursed strictly in their local domestic bank currency (via Wise FX conversion at payout time), or can sellers elect to hold multi-currency balances in USD/EUR?
   - *Proposed Default:* Disburse in the seller's verified local bank account currency using Wise Platform live wholesale rates.
