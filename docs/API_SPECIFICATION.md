# API Specification & Contracts
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Software Architect & Senior Full-Stack Engineer
- **Base Protocol:** HTTPS REST / JSON
- **Framework:** Fastify (TypeScript) + Ajv Validation + Swagger/OpenAPI 3.1

---

## 1. Global Conventions & Standards

### 1.1 Base URL & Versioning
- **Production Base URL:** `https://api.marketplace.global/api/v1`
- **Local Dev URL:** `http://localhost:4000/api/v1`
- **Versioning Strategy:** URI path versioning (`/api/v1/...`).

### 1.2 Headers & Content Negotiation
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (for authenticated endpoints)
- `Idempotency-Key: <UUIDv4>` (Mandatory for mutating operations: checkout, refunds, shipments, payouts)
- `X-Region-Code: <ISO_REGION>` (e.g. `US`, `EU`, `GCC`, `PK`)
- `X-Currency-Code: <CURRENCY_CODE>` (e.g. `USD`, `EUR`, `AED`, `GBP`)

### 1.3 Uniform Envelope & Response Format

**Standard Success Response:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01HX982...",
    "timestamp": "2026-10-24T11:20:00.000Z"
  }
}
```

**Paginated Success Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 154,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "requestId": "req_01HX982...",
    "timestamp": "2026-10-24T11:20:00.000Z"
  }
}
```

**Standard RFC 7807 Problem Details Error Response:**
```json
{
  "success": false,
  "error": {
    "type": "https://errors.marketplace.global/inventory/out-of-stock",
    "title": "Inventory Allocation Conflict",
    "status": 409,
    "detail": "Requested quantity for SKU 'MEC-KB-001' exceeds available warehouse stock.",
    "instance": "/api/v1/checkout",
    "invalidParams": [
      {
        "name": "items[0].quantity",
        "reason": "Available stock is 2, requested 5."
      }
    ]
  },
  "meta": {
    "requestId": "req_01HX982...",
    "timestamp": "2026-10-24T11:20:00.000Z"
  }
}
```

---

## 2. Authentication & Authorization (RBAC)

### 2.1 Role Matrix
| Role | Identifier | Permitted Operations |
| :--- | :--- | :--- |
| **Anonymous** | `public` | Browse catalog, view FX rates, add to local cart |
| **Customer** | `customer` | Checkout, view personal parent orders, track sub-orders, request returns |
| **Seller** | `seller` | Manage own warehouses, inventory, products, fulfill assigned sub-orders, view earnings |
| **Super Admin** | `super_admin` | Global KYC review, ledger inspection, category CRUD, system configuration |

### 2.2 Auth Endpoints (`/api/v1/auth`)

#### `POST /auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "vendor@tokyo-audio.jp",
    "password": "SecurePassword123!",
    "fullName": "Kenji Sato",
    "role": "seller"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "email": "vendor@tokyo-audio.jp",
        "fullName": "Kenji Sato",
        "role": "seller"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d891b..."
    }
  }
  ```

#### `POST /auth/login`
- **Access:** Public
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response (200 OK):** User details + Access Token (15m expiry) + Refresh Token (7d expiry).

---

## 3. Regions, Currencies & FX Rates (`/api/v1/regions`)

#### `GET /regions`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "code": "US",
        "name": "United States",
        "defaultCurrency": "USD",
        "taxEngine": "stripe_tax"
      },
      {
        "code": "GCC",
        "name": "Gulf Cooperation Council",
        "defaultCurrency": "AED",
        "taxEngine": "stripe_tax"
      }
    ]
  }
  ```

#### `GET /regions/exchange-rates`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "baseCurrency": "USD",
      "rates": {
        "EUR": { "marketRate": 0.920000, "buffer": 1.5, "effectiveRate": 0.933800 },
        "AED": { "marketRate": 3.672500, "buffer": 1.5, "effectiveRate": 3.727588 },
        "GBP": { "marketRate": 0.790000, "buffer": 1.5, "effectiveRate": 0.801850 }
      },
      "updatedAt": "2026-10-24T11:00:00.000Z"
    }
  }
  ```

---

## 4. Catalog & Search (`/api/v1/catalog`, `/api/v1/search`)

#### `GET /catalog/products`
- **Access:** Public
- **Query Params:** `categoryId`, `sellerId`, `page`, `limit`, `currency=EUR`
- **Response (200 OK):** Array of products with localized title/description and converted price based on effective exchange rate.

#### `GET /search` (Meilisearch Engine)
- **Access:** Public
- **Query Params:** `q=wireless+keyboard&category=electronics&priceMin=50&priceMax=200&origin=JP`
- **Response (200 OK):** Typo-tolerant hits, faceted attribute counts, execution time $< 25\text{ ms}$.

---

## 5. Cart & DDP Tax / Duty Quotation (`/api/v1/cart`)

#### `POST /cart/quote-ddp`
- **Access:** Public / Customer
- **Description:** Evaluates multi-seller cart, aggregates by origin warehouse, and calculates international shipping and DDP customs/VAT.
- **Request Body:**
  ```json
  {
    "currency": "EUR",
    "destination": {
      "country": "DE",
      "city": "Berlin",
      "postalCode": "10115"
    },
    "items": [
      {
        "variantId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "quantity": 1
      },
      {
        "variantId": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
        "quantity": 2
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "currency": "EUR",
      "totalItemCost": 220.00,
      "totalShippingCost": 28.50,
      "totalCustomsDuty": 14.30,
      "totalImportVAT": 49.93,
      "totalGrandDDP": 312.73,
      "shipmentSplits": [
        {
          "sellerId": "s_tokyo_01",
          "sellerName": "Tokyo Audio",
          "warehouseOrigin": "JP",
          "itemsSubtotal": 120.00,
          "shippingCost": 18.50,
          "customsDuty": 8.00,
          "importVAT": 27.84,
          "carrierService": "DHL Express Worldwide"
        },
        {
          "sellerId": "s_austin_02",
          "sellerName": "Texas Tech Hub",
          "warehouseOrigin": "US",
          "itemsSubtotal": 100.00,
          "shippingCost": 10.00,
          "customsDuty": 6.30,
          "importVAT": 22.09,
          "carrierService": "FedEx International Priority"
        }
      ]
    }
  }
  ```

---

## 6. Checkout & Split Orders (`/api/v1/checkout`, `/api/v1/orders`)

#### `POST /checkout`
- **Access:** Authenticated Customer
- **Header:** `Idempotency-Key: <UUID>`
- **Description:** Atomically reserves stock in Redis, creates Parent Order + Split Sub-Orders in PostgreSQL transaction, and creates Stripe PaymentIntent with `transfer_group`.
- **Request Body:**
  ```json
  {
    "currency": "EUR",
    "shippingAddress": {
      "fullName": "Hans Schmidt",
      "country": "DE",
      "state": "Berlin",
      "city": "Berlin",
      "postalCode": "10115",
      "addressLine1": "Friedrichstraße 43",
      "phone": "+49 30 1234567"
    },
    "billingAddress": {
      "country": "DE",
      "city": "Berlin",
      "postalCode": "10115",
      "addressLine1": "Friedrichstraße 43"
    },
    "items": [
      {
        "variantId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "warehouseId": "w_jp_01",
        "quantity": 1
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "parentOrderId": "7d99bc99-9c0b-4ef8-bb6d-6bb9bd380a99",
      "orderNumber": "PO-2026-1024-8901",
      "totalAmount": 174.34,
      "currency": "EUR",
      "stripeClientSecret": "pi_3Mtwx8_secret_xyz...",
      "status": "requires_payment",
      "subOrders": [
        {
          "subOrderId": "8e99bc99-9c0b-4ef8-bb6d-6bb9bd380b01",
          "subOrderNumber": "SO-2026-1024-8901-01",
          "sellerId": "s_tokyo_01",
          "total": 174.34
        }
      ]
    }
  }
  ```

---

## 7. Seller Operations (`/api/v1/seller`)

#### `POST /seller/onboarding`
- **Access:** Authenticated Seller
- **Payload:** Business registration, legal structure, tax ID, KYC documents.

#### `GET /seller/warehouses`
- **Access:** Authenticated Seller
- **Returns:** All active physical warehouse dispatch nodes for this seller.

#### `GET /seller/sub-orders`
- **Access:** Authenticated Seller (Strict Tenant Isolation)
- **Filters:** `status=processing`, `dateFrom`, `dateTo`
- **Returns:** Paginated sub-orders assigned exclusively to this seller.

#### `POST /seller/sub-orders/:id/fulfill`
- **Access:** Authenticated Seller
- **Action:** Generates AWB Shipping Label and PDF Commercial Customs Invoice via carrier adapter, sets sub-order to `manifested`.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "subOrderId": "8e99bc99-9c0b-4ef8-bb6d-6bb9bd380b01",
      "carrier": "DHL Express",
      "trackingNumber": "DHL-9876543210",
      "labelUrl": "https://cdn.marketplace.global/labels/dhl_9876.pdf",
      "commercialInvoiceUrl": "https://cdn.marketplace.global/invoices/inv_9876.pdf",
      "status": "manifested"
    }
  }
  ```

#### `GET /seller/finances/ledger`
- **Access:** Authenticated Seller
- **Returns:** Detailed view of pending escrow, rolling reserve held, settled payouts, and upcoming disbursement schedule.

---

## 8. Webhook Ingestion (`/api/v1/webhooks`)

#### `POST /webhooks/stripe`
- **Header:** `Stripe-Signature: t=1614000...,v1=...`
- **Handles:** `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`.

#### `POST /webhooks/carrier`
- **Handles:** Tracking milestone updates from EasyPost/Shippo (`in_transit`, `customs_cleared`, `delivered`).
- **Trigger:** On `delivered`, begins 14-day escrow maturity countdown.
