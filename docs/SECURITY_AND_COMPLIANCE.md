# Security & Compliance Specification
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Principal Security Engineer & Compliance Officer
- **Scope:** Payment Security (PCI-DSS), Multi-Tenant Data Isolation, Cryptographic Integrity, Cross-Border Regulatory Guardrails

---

## 1. Payment Security & PCI-DSS Scope Demarcation

### 1.1 Strict Zero-Card-Data Architecture (SAQ-A)
- **Primary Principle:** The platform's application servers, databases, logs, and workers **NEVER** handle, process, transmit, or store Primary Account Numbers (PAN), CVVs, PINs, or raw magnetic stripe data.
- **Client-Side Tokenization:** All credit/debit card data is captured exclusively inside client-side iframes hosted directly by the payment processor (e.g., Stripe Elements or Adyen Drop-in).
- **Backend Token Exchange:** The Fastify backend only handles opaque provider tokens (e.g., `pi_3Mtwx8...`, `seti_...`).
- **Compliance Category:** PCI-DSS **SAQ-A** (Self-Assessment Questionnaire A), the lowest liability and risk category under PCI-DSS standards.

```text
[Customer Browser] ──── Card Details (Encrypted) ────> [Stripe/Adyen Vault]
        │                                                     │
        │ Submits Form                                        │ Returns PaymentIntent Token
        ▼                                                     ▼
[Customer Browser] ──── POST /api/v1/checkout (Token) ─> [Fastify Backend]
                                                              │
                                                              ▼
                                                        [PostgreSQL DB]
                                                   (Stores ONLY 'pi_3Mtwx8')
```

---

## 2. Multi-Tenant Isolation & Role-Based Authorization

### 2.1 Tenant Isolation Guarantees
- In a multi-vendor marketplace, cross-tenant data leakage (e.g., Seller A inspecting Seller B's inventory, sales numbers, or customer shipping addresses) represents an existential operational failure.
- **Enforcement Rules:**
  1. **Server-Side Context Validation:** Never trust client-supplied `seller_id` in request payloads. The authenticated `seller_id` is derived strictly from the verified JWT payload and database session.
  2. **Query Scoping:** Every seller data access method in Drizzle ORM must include an immutable tenant filter:
     ```typescript
     and(eq(subOrders.sellerId, currentSeller.id), eq(subOrders.id, requestedSubOrderId))
     ```
  3. **Object Storage Isolation:** Carrier labels and commercial invoices are stored in bucket paths partitioned by seller ID:
     `s3://marketplace-assets/sellers/{sellerId}/sub-orders/{subOrderId}/` with signed time-limited read URLs.

### 2.2 JWT Authentication & Session Hardening
- **Signature Algorithm:** Asymmetric RS256 or hardened HMAC-SHA256 with minimum 256-bit entropy.
- **Token Lifespans:**
  - Access Token: 15 minutes.
  - Refresh Token: 7 calendar days, stored in HTTP-only, Secure, SameSite=Strict cookies.
- **Immediate Revocation (Blocklist):** Token revocation (e.g., upon password reset or admin suspension) is tracked in Redis via `token:revoked:{jti}` with TTL matching the remaining token lifespan.

---

## 3. Webhook Security & Idempotency Engine

### 3.1 Cryptographic Signature Verification
External webhooks (Stripe, EasyPost, Wise) represent asynchronous external entrypoints capable of state mutation (marking orders paid, triggering payouts).
- All webhook endpoints verify the raw HTTP request body against provider-specific cryptographic signatures:
  - Stripe: `stripe.webhooks.constructEvent(rawBody, signature, secret)`
  - EasyPost: HMAC-SHA256 signature verification over raw request buffer.
- Webhook endpoints bypass standard Fastify JSON parsing to retain pristine raw byte buffers required for signature verification.

### 3.2 Idempotency Defense
- **The Problem:** Payment gateways and carriers utilize at-least-once delivery; network retries can send the identical webhook multiple times.
- **The Solution:** Every incoming webhook is recorded in `webhook_events` within a PostgreSQL transaction enforcing `UNIQUE(source, event_id)`:
  - If event already exists in `processed` status $\rightarrow$ reply `200 OK` immediately without re-processing.
  - If event is new $\rightarrow$ process inside transaction and mark `processed`.

---

## 4. Cross-Border Escrow & Regulatory Guardrails

### 4.1 Fiduciary Separation of Funds
- In an international marketplace, the operator cannot arbitrarily treat gross customer payments as corporate revenue. Funds held prior to order fulfillment belong legally to the buyer (in escrow) or to the seller (payable).
- **Contractual Inspection Window:** Buyer funds remain in platform escrow until carrier delivers the goods plus an elapsed 14-day dispute/return window.
- **Mock Adapters Default:** Local development, CI, and staging environments use `MockPaymentAdapter` and `MockLogisticsAdapter`. Live payout execution to foreign bank accounts requires explicit legal clearance and production keys.

### 4.2 Delivered Duty Paid (DDP) & International Taxation
- **Incoterms 2020 Compliance:** All cross-border orders are transacted under **DDP (Delivered Duty Paid)**. The seller/platform is responsible for paying import duties and VAT at destination customs.
- **Harmonized System (HS) Codes:** Every product catalog item must carry a valid 6-to-10 digit HS code.
- **EU IOSS & UK HMRC:** Orders shipped to the EU below €150 or UK below £135 collect VAT at checkout under platform marketplace tax rules.

---

## 5. Defense-in-Depth & Threat Modeling

| Threat Vector | Mitigation Strategy | Implementation Layer |
| :--- | :--- | :--- |
| **Card Testing / Bot Attacks** | Cloudflare Bot Management + Turnstile captcha + Fastify IP rate-limiting | Cloudflare Edge & Fastify Plugin |
| **Inventory Exhaustion (DoS)** | 15-minute TTL on Redis stock reservations + max cart quantity limits | Redis Lua Script & BullMQ Worker |
| **Tampering with Ledger Records** | SQL triggers prohibiting `UPDATE`/`DELETE` + Append-only journal architecture | PostgreSQL Engine Level |
| **Privilege Escalation** | Strict RBAC guards (`@fastify/jwt` preHandler hooks with role bitmasks) | Fastify Route Layer |
| **Secret Exposure** | Strict Zod validation on startup (`env.ts`), zero secrets in source control | Config & Deployment Pipeline |
