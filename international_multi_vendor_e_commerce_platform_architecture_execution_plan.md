# Global Multi-Vendor Marketplace Specification & Engineering Plan
**Platform Scope:** International Multi-Vendor E-Commerce (Enterprise Grade)  
**Core Backend Stack:** Fastify (TypeScript) + PostgreSQL + Redis + BullMQ  
**Architecture Style:** Modular Monolith / Microservices-Ready Decoupled Architecture  
**Target Capabilities:** Cross-Border Sales, Multi-Currency, Multi-Warehouse Split Logistics, Escrow Payouts, Automated Customs/Taxation  

---

## Executive Summary

Building a platform of this caliber requires moving beyond typical single-vendor architectures (such as standard Shopify or WooCommerce builds). A marketplace operating across international boundaries must orchestrate three distinct user interfaces (**Customer Storefront**, **Vendor Portal / Seller Center**, and **Super Admin Platform**) backed by an enterprise transaction engine capable of:
1. **Dynamic Regional Localization:** Multi-currency display, real-time FX rate caching, localized VAT/GST/US sales tax calculation (DDP mode), and automated language routing.
2. **Atomic Inventory & Split-Order Execution:** Real-time stock reservations across geographically distributed seller warehouses and dynamic splitting of single parent orders into multiple sub-orders.
3. **Escrow Financial Accounting:** Compliant cross-border payment splits, marketplace fee withholding, rolling chargeback reserves, and automated localized disbursements.

---

## 1. System Architecture & Tech Stack

```
[Clients: Next.js Web Storefront | React Seller Portal | React Super Admin]
                                │
                       HTTPS / REST / WS
                                │
               [Cloudflare Edge / Reverse Proxy]
                                │
              [Fastify API Gateway & Route Engine]
           ┌────────────────────┼────────────────────┐
           │                    │                    │
   [PostgreSQL DB]        [Redis Cluster]      [Meilisearch]
   (Prisma / Drizzle)     (Queues & Cache)     (Product Indexing)
   • Multi-Tenant Schema  • BullMQ Workers     • Multi-language
   • Double-Entry Ledger  • Rate Limiting      • Faceted Filtering
   • Split Sub-Orders     • Inventory Locks    • Fast Typo-tolerance
```

### Stack Selection & Rationale

| Infrastructure Layer | Selected Technology | Architecture Role & Rationale |
| :--- | :--- | :--- |
| **API Framework** | **Fastify (TypeScript)** | Ultra-low overhead, native JSON Schema validation via Ajv, 2-3x higher throughput compared to Express, ideal for high-traffic events and webhooks. |
| **Relational Database** | **PostgreSQL (v15+)** | ACID compliance essential for financial ledgers, transactional consistency during split-orders, and JSONB support for flexible international localized product attributes. |
| **ORM / Query Builder** | **Drizzle ORM** | Lightweight, type-safe, near-zero startup overhead, raw SQL performance without runtime abstraction penalties. |
| **Cache & Task Queue** | **Redis + BullMQ** | Redis provides sub-millisecond atomic locks (`SETNX`) during checkouts. BullMQ handles asynchronous jobs (carrier label generation, webhook processing, batch payouts). |
| **Search Engine** | **Meilisearch** | Multi-lingual typo-tolerant search, instant faceted filtering by brand/price/rating, lightweight compared to full-blown Elasticsearch clusters. |
| **Storefront App** | **Next.js (React) + Tailwind CSS** | Server-side rendering (SSR) and incremental static regeneration (ISR) for international SEO, automatic localized routing (`/en-us`, `/ar-ae`), dynamic edge caching. |
| **Seller & Admin Portals** | **React / Vite + Tailwind CSS** | Fast Single Page Applications (SPA) optimized for complex data tables, bulk CSV operations, and interactive analytics. |
| **Media / Asset Storage** | **Cloudflare R2 + AWS S3** | Zero-egress cost object storage paired with on-the-fly image optimization pipelines (automatic WebP/AVIF transformation). |

---

## 2. Fastify Modular Project Blueprint

```text
src/
├── app.ts                         # Fastify server bootstrap & global middleware
├── server.ts                      # Cluster lifecycle, shutdown signals (SIGTERM)
├── config/
│   ├── env.ts                     # Strict environment variable validation via Zod
│   ├── cors.ts                    # Dynamic origin management
│   └── rateLimit.ts               # IP & User token sliding-window limits
├── plugins/
│   ├── db.ts                      # PostgreSQL pool initialization
│   ├── redis.ts                   # Redis connection instance
│   ├── auth.ts                    # JWT verification & Role-Based Access Control (RBAC)
│   ├── swagger.ts                 # OpenAPI/Swagger auto-generation
│   └── errorHandler.ts            # Centralized exception formatter
├── modules/
│   ├── auth/                      # Customer & Vendor Authentication flows
│   ├── regions/                   # Currencies, FX exchange rates, country rules
│   ├── products/                  # Catalog, categories, variants, HS Codes
│   ├── cart/                      # Cart operations, multi-seller item groupings
│   ├── orders/                    # Parent orders & split-order state engine
│   ├── payments/                  # Stripe Connect, Adyen, Webhook listener
│   ├── logistics/                 # EasyPost/Shippo carrier integrations
│   ├── sellers/                   # KYC verification, warehouse management
│   └── payouts/                   # Ledger settlement, Wise/Payoneer payouts
└── workers/                       # BullMQ asynchronous background processors
    ├── orderSplitWorker.ts
    ├── carrierWebhookWorker.ts
    └── payoutBatchWorker.ts
```

---

## 3. Relational Database Schema Design (PostgreSQL)

```sql
-- 1. REGIONAL CONFIGURATION & CURRENCIES
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'US', 'EU', 'GCC', 'PK'
    name VARCHAR(100) NOT NULL,
    default_currency VARCHAR(3) NOT NULL, -- 'USD', 'EUR', 'AED'
    tax_engine VARCHAR(50) DEFAULT 'stripe_tax',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(14, 6) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SELLERS & MULTI-WAREHOUSES
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    legal_entity_type VARCHAR(50) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    stripe_connected_account_id VARCHAR(255),
    wise_recipient_id VARCHAR(255),
    commission_rate NUMERIC(5, 2) DEFAULT 10.00, -- default 10%
    rolling_reserve_rate NUMERIC(5, 2) DEFAULT 10.00, -- 10% held for chargebacks
    kyc_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    warehouse_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    state_province VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS, VARIANTS & CROSS-BORDER ATTRIBUTES
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    title_i18n JSONB NOT NULL, -- {"en": "Mechanical Keyboard", "ar": "لوحة مفاتيح"}
    description_i18n JSONB NOT NULL,
    category_id UUID NOT NULL,
    brand VARCHAR(100),
    hs_code VARCHAR(20) NOT NULL, -- Harmonized System code for customs calculation
    origin_country VARCHAR(2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    weight_grams NUMERIC(10, 2) NOT NULL,
    length_cm NUMERIC(10, 2) NOT NULL,
    width_cm NUMERIC(10, 2) NOT NULL,
    height_cm NUMERIC(10, 2) NOT NULL,
    base_price_usd NUMERIC(12, 2) NOT NULL
);

CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    available_stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_positive_stock CHECK (available_stock >= 0)
);

-- 4. PARENT & SPLIT SUB-ORDERS
CREATE TABLE parent_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    exchange_rate_applied NUMERIC(14, 6) NOT NULL,
    payment_intent_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'requires_payment',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sub_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_order_id UUID NOT NULL REFERENCES parent_orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    subtotal NUMERIC(12, 2) NOT NULL,
    shipping_cost NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    carrier_name VARCHAR(50),
    carrier_tracking_code VARCHAR(255),
    carrier_label_url TEXT,
    commercial_invoice_url TEXT,
    order_status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'manifested', 'shipped', 'delivered', 'disputed'
    delivered_at TIMESTAMPTZ
);

-- 5. SELLER FINANCIAL LEDGER (DOUBLE-ENTRY ESCROW)
CREATE TABLE seller_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id),
    sub_order_id UUID NOT NULL REFERENCES sub_orders(id),
    gross_amount NUMERIC(12, 2) NOT NULL,
    marketplace_commission NUMERIC(12, 2) NOT NULL,
    withheld_tax NUMERIC(12, 2) NOT NULL,
    rolling_reserve_amount NUMERIC(12, 2) NOT NULL,
    net_payable_amount NUMERIC(12, 2) NOT NULL,
    escrow_release_due TIMESTAMPTZ NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. International Logistics, Taxes & Payment Gateway Workflows

### A. Delivered Duty Paid (DDP) Checkout Pipeline
To ensure international buyers are not blindsided by import duties upon parcel arrival, the system executes an automated tax evaluation step:
1. Fastify validates the cart payload and isolates items by warehouse origin country.
2. The checkout service makes a bulk evaluation request to **Stripe Tax** or **Avalara** using destination coordinates and SKU **HS Codes**.
3. Customs duties, Import VAT (e.g., EU IOSS compliance), and local sales taxes are added directly to the checkout summary.

```
[Customer Checks Out]
       │
       ├──> Identify Origin Warehouses (e.g., US & PK) vs Destination (e.g., UK)
       ├──> Fetch live rates from EasyPost (DHL / FedEx / Aramex)
       ├──> Fetch Duties & VAT from Stripe Tax (based on HS Codes)
       └──> Display single transparent DDP total (No surprise duties at door)
```

### B. Payment Capture & Split Escrow Flow
1. **Single Payment Capture:** The customer executes a single card transaction (via Apple Pay, Google Pay, or Credit Card) through Stripe Elements or Adyen Drop-in.
2. **Transfer Grouping:** The payment is assigned a `transfer_group = parent_order_id`.
3. **Escrow Hold:** Funds are retained in the platform account.
4. **Inspection Window:** Once the shipping carrier triggers the `delivered` webhook, an automated countdown timer (e.g., 7 or 14 business days) begins.
5. **Disbursement:** If no return or dispute is lodged, the background worker invokes the **Wise Platform API** or **Stripe Transfer** to disburse funds to the vendor, holding the designated rolling reserve (e.g., 10%) for 60 days.

---

## 5. Fastify High-Performance Implementation Samples

### Central Server Bootstrap (`src/app.ts`)

```typescript
import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    trustProxy: true,
  });

  // Global plugins
  app.register(sensible);
  app.register(cors, {
    origin: (origin, cb) => {
      // Dynamic origin checks for multi-regional domains
      cb(null, true);
    },
  });

  app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-prod',
  });

  // Module Routes
  // app.register(orderRoutes, { prefix: '/api/v1/orders' });
  // app.register(productRoutes, { prefix: '/api/v1/products' });

  return app;
}
```

### Split-Order Route with Ajv Schema Validation (`src/modules/orders/routes.ts`)

```typescript
import { FastifyPluginAsync } from 'fastify';

const createOrderSchema = {
  body: {
    type: 'object',
    required: ['currency', 'shippingAddress', 'items'],
    properties: {
      currency: { type: 'string', minLength: 3, maxLength: 3 },
      shippingAddress: {
        type: 'object',
        required: ['country', 'city', 'line1', 'postalCode'],
        properties: {
          country: { type: 'string', minLength: 2, maxLength: 2 },
          city: { type: 'string' },
          line1: { type: 'string' },
          postalCode: { type: 'string' },
        },
      },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['variantId', 'quantity', 'warehouseId'],
          properties: {
            variantId: { type: 'string', format: 'uuid' },
            warehouseId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
  },
};

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/checkout', { schema: createOrderSchema }, async (request, reply) => {
    const { currency, shippingAddress, items } = request.body as any;

    // 1. Atomic Redis Inventory Lock
    // 2. Query rates & evaluate DDP cross-border taxes
    // 3. Create Parent Order + Child Sub-orders within a SQL Transaction
    
    return reply.status(201).send({
      message: 'Checkout initialized successfully',
      parentOrderId: 'mock-uuid',
      status: 'requires_payment',
    });
  });
};
```

---

## 6. Phased Implementation Roadmap

```
[Phase 1: Foundation] ──> [Phase 2: Catalog & Search] ──> [Phase 3: Checkout & Tax] ──> [Phase 4: Logistics & Payout] ──> [Phase 5: Scale]
    (Weeks 1-4)                  (Weeks 5-8)                   (Weeks 9-13)                 (Weeks 14-18)                (Weeks 19-22)
```

### Phase 1: Foundation & Data Modeling (Weeks 1–4)
* Initialize Monorepo (Turborepo) encompassing Fastify Backend, Next.js Storefront, and React Portals.
* Scaffold PostgreSQL schema with Drizzle ORM migrations for multi-region structures.
* Implement JWT + RBAC authentication (Distinct access layers for Customers, Vendors, and Platform Super Admins).
* Configure Redis connection and basic BullMQ worker topology.

### Phase 2: Catalog Engine & Seller Center (Weeks 5–8)
* Build Seller Center portal with KYC documentation upload pipeline (Business license, Identity proofs, bank verifications).
* Product lifecycle routes: Attribute variations, inventory allocation across multiple physical warehouses, and international HS Code classification.
* Stand up Meilisearch instance and build synchronization workers that auto-index on product creation/update.

### Phase 3: Dynamic Multi-Currency Cart & Split Checkout (Weeks 9–13)
* Develop GeoIP lookup at Cloudflare Edge to auto-select preferred localized currency and regional storefront settings.
* Implement distributed cart logic that visually and structurally breaks items down by origin warehouse.
* Integrate Stripe Connect and Stripe Tax engines for real-time DDP calculation and localized payment capture.
* Build atomic inventory reservation mechanism using Redis `SETNX` commands to prevent overselling during flash events.

### Phase 4: Cross-Border Logistics & Settlement Engine (Weeks 14–18)
* Integrate shipping aggregator APIs (**EasyPost** / **Shippo**) to programmatically fetch multi-carrier rates (DHL, FedEx, UPS, Aramex).
* Automate generation of PDF Commercial Invoices and airway bill (AWB) shipping labels upon order confirmation.
* Deploy webhook processors tracking order milestones (`manifested`, `in_transit`, `customs_cleared`, `delivered`).
* Launch the Double-Entry Escrow Ledger: Automate release of vendor balances via Wise Platform API / Stripe Transfers following the return expiration window.

### Phase 5: Concurrency Hardening & Global Deployment (Weeks 19–22)
* Conduct rigorous load tests with `autocannon` and `k6` to simulate high-concurrency checkout spikes.
* Configure Cloudflare WAF, Enterprise Bot Management, and Stripe Radar rules to mitigate credit card testing fraud and chargebacks.
* Establish rolling reserves policies (holding 10% of new vendor payouts for 60 days).
* Soft launch with an initial regional corridor (e.g., UAE $\leftrightarrow$ Pakistan or US $\leftrightarrow$ UK) before expanding global operations.

---

## 7. Operational Best Practices & Safety Precautions

1. **Never Touch Raw Payment Card Data:** Always leverage Stripe Elements, Apple Pay sheets, or Adyen Drop-ins to retain PCI-DSS SAQ-A compliance scope.
2. **Mitigate Currency Slippage:** When displaying prices in non-base currencies, apply a **1.5% to 2% FX buffer** over real-time exchange rates to shield the business from market swings between cart addition and final transaction settlement.
3. **Strict Warehouse Constraints:** Ensure shipping label generation checks that the package dimensions and dead weight are within carrier restrictions prior to showing options to the customer.