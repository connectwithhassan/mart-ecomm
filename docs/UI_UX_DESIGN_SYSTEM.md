# UI/UX Design System Specification
## Enterprise International Multi-Vendor E-Commerce Platform

- **Document Version:** 1.0.0
- **Status:** Baseline Approved for Planning
- **Author:** Product Designer & Frontend Architect
- **Design Intelligence Engine:** `ui-ux-pro-max` (Verified local dataset & scripts)
- **Component Primitives:** Tailwind CSS + Radix UI Primitives / shadcn/ui
- **Iconography Standard:** Phosphor Icons (`@phosphor-icons/react`) with Heroicons fallback

---

## 1. Multi-Experience Visual Architecture

The marketplace encompasses two distinct operational interfaces with tailored design profiles:
1. **International Customer Storefront (B2C):** Optimized for discovery, brand trust, emotional connection, and high checkout conversion.
2. **Seller Center & Super Admin Portals (B2B):** Optimized for high-density telemetry, low cognitive load, rapid data entry, and rigorous tabular manipulation.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MARKETPLACE UI ECOSYSTEM                       │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. International Customer         │ 2. Seller Center & Super Admin     │
│    Storefront (Next.js)           │    Portals (React + Vite)          │
├───────────────────────────────────┼────────────────────────────────────┤
│ Pattern: Feature-Rich Showcase    │ Pattern: Real-Time / Operations    │
│ Style: Vibrant & Block-Based      │ Style: High-Density Glassmorphism  │
│ Headings: Rubik (Google Fonts)    │ Headings: Fira Code (Monospace)    │
│ Body: Nunito Sans (Google Fonts)  │ Body: Fira Sans (Technical Sans)   │
│ Density: Spacious (Relaxed 4-8px) │ Density: High (8/10 Spacing Scale) │
│ Palette: Forest Green + Urgency   │ Palette: Deep Slate + Operations   │
│          Orange (#059669/#EA580C) │          Emerald (#0F172A/#22C55E) │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Storefront Design System (Customer Experience)

*Generated via `ui-ux-pro-max` intelligence for international multi-vendor e-commerce.*

### 2.1 Color Tokens & Semantics
| Role | Hex Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `#059669` | `--store-primary` | Brand accents, key trust badges, active tabs |
| **On Primary** | `#FFFFFF` | `--store-on-primary` | Text on primary brand backgrounds |
| **Secondary** | `#10B981` | `--store-secondary` | Secondary highlights, ratings, success alerts |
| **Accent / CTA** | `#EA580C` | `--store-accent` | Primary checkout CTAs, Add-to-Cart buttons, urgency tags |
| **On Accent** | `#FFFFFF` | `--store-on-accent` | Text inside primary CTA buttons |
| **Background** | `#F8FAFC` | `--store-background` | Global viewport background (neutral slate-50) |
| **Foreground** | `#0F172A` | `--store-foreground` | Main high-contrast readable body text (15:1 contrast) |
| **Card Surface** | `#FFFFFF` | `--store-card` | Product cards, cart containers, review boxes |
| **Muted Surface** | `#F1F5F9` | `--store-muted` | Search bar background, inactive filter pills |
| **Muted Text** | `#64748B` | `--store-muted-fg` | Breadcrumbs, metadata, carrier transit times |
| **Border** | `#E2E8F0` | `--store-border` | Subtle structural dividers and input outlines |
| **Destructive** | `#DC2626` | `--store-destructive` | Out of stock warnings, error banners |

### 2.2 Typography
- **Headings Font:** `Rubik, sans-serif` (Google Fonts: 500, 600, 700)
- **Body & Controls:** `Nunito Sans, sans-serif` (Google Fonts: 400, 500, 600, 700)
- **Type Scale:**
  - `Display / Hero Title`: $36\text{px}$ mobile $\rightarrow$ $48\text{px}$ desktop (line-height: 1.15, font-weight: 700)
  - `Section Heading (H2)`: $24\text{px}$ mobile $\rightarrow$ $30\text{px}$ desktop (font-weight: 600)
  - `Product Card Title`: $16\text{px}$ (font-weight: 600, 2-line clamp)
  - `Body Standard`: $15\text{px}$ (line-height: 1.5, regular/medium)
  - `Microcopy & Badges`: $12\text{px}$ (font-weight: 600, uppercase letter-spacing +0.05em)

---

## 3. Seller Center & Super Admin Design System (B2B Portals)

*Generated via `ui-ux-pro-max` intelligence with Density Dial set to 8/10.*

### 3.1 Color Tokens & Semantics
| Role | Hex Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Base Surface** | `#0F172A` | `--portal-bg` | Deep slate-900 viewport background |
| **Card / Panel** | `#1B2336` | `--portal-card` | Elevated navigation bar, sidebar, and container cards |
| **Muted Surface** | `#272F42` | `--portal-muted` | Table header rows, inactive badge containers |
| **Primary Text** | `#F8FAFC` | `--portal-fg` | Ultra-crisp slate-50 foreground |
| **Muted Text** | `#94A3B8` | `--portal-muted-fg` | Table column titles, audit log timestamps |
| **Border / Grid** | `#334155` | `--portal-border` | High-precision 1px borders between table rows |
| **Success / Payout**| `#22C55E` | `--portal-success` | Settled earnings, delivered statuses, verified KYC |
| **Warning / Escrow**| `#F59E0B` | `--portal-warning` | Active 14-day escrow hold, pending carrier dispatch |
| **Danger / Risk** | `#EF4444` | `--portal-danger` | Rolling reserve deduction, failed webhook, dispute |

### 3.2 Typography & Density (8/10)
- **Headings & Telemetry:** `Fira Code, monospace` (400, 500, 600)
- **Body & Tables:** `Fira Sans, sans-serif` (400, 500)
- **High-Density Spacing Rhythm:**
  - Table cell padding: `py-2.5 px-3` (compact, allows viewing 15+ rows without scrolling)
  - Form field height: `h-9` ($36\text{px}$) with internal `text-sm`
  - Button height: `h-8` ($32\text{px}$) for secondary table actions

---

## 4. Internationalization & Regional Localization UX

1. **Header Country/Currency Modal:**
   - Always visible in global header displaying: `[Flag] Delivery Country | Currency Code | Language` (e.g. `🇺🇸 United States | USD ($) | EN`).
   - Tapping opens an accessible Radix Dialog modal allowing instant change of delivery destination, automatically recalculating cart DDP taxes.
2. **Delivered Duty Paid (DDP) Transparency:**
   - Product detail pages and cart items display clear badge:
     `✓ All Import Duties & Taxes Included (DDP)`
   - Full cost breakdown modal reveals: `Item Subtotal + Int'l Shipping + Customs Tariffs + Local VAT = Total Landing Cost`.
3. **Right-to-Left (RTL) Readiness:**
   - Full CSS logical properties (`ms-`, `me-`, `start-`, `end-`) across all layouts to support Arabic (`ar-AE`, `ar-SA`) without layout breaks.

---

## 5. UI/UX Rules & Accessibility Contract (Enforced)

### 5.1 Iconography Standards
- **Vector-Only & Consistency:**
  - Use vector icons from **Phosphor Icons (`@phosphor-icons/react`)**.
  - Fallback strictly to **Heroicons (`@heroicons/react`)** if Phosphor lacks an exact glyph.
  - **Zero Emoji As Icons:** Never use emojis (📦, 🛒, ⚠️, ⚙️) as interface icons or buttons. Emojis render inconsistently across OS platforms and break accessibility trees.
- **Icon Sizing:** Design tokens `icon-sm` (16px), `icon-md` (20px), `icon-lg` (24px).
- **Semantics:**
  - Decorative icons adjacent to text: `aria-hidden="true"`.
  - Standalone icon buttons: Must have explicit `aria-label` (e.g. `aria-label="Remove item from cart"`).

### 5.2 Form UX & Error Feedback
- **WCAG 2.1 AA Contrast:**
  - Normal text contrast $\ge 4.5:1$ against surface in both light and dark modes.
  - Interactive control borders and active states $\ge 3:1$ against adjacent background.
- **Failed Submit Flow (Accessible Error Summary):**
  - When checkout or form validation fails:
    1. Render a linked Error Summary box at the top of the form with `role="alert"` and `tabIndex={-1}`.
    2. Move focus immediately to the summary container.
    3. Each error in the summary links directly (`href="#field-id"`) to the invalid input.
    4. Maintain clear inline field error messages below each input with `aria-describedby="field-id-error"`.

### 5.3 Data Tables (Seller & Admin Portals)
- Built using **TanStack Table (`@tanstack/react-table`)** paired with semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` markup.
- **Horizontal Overflow Preservation:** All tables enclosed in an `overflow-x-auto` container with focusable keyboard scrollability.
- **Filter Chips Wrapping:** Filter bars must use `flex-wrap gap-2` or an operable disclosure popover, never clipping labels on small widths.
