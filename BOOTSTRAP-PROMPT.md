# MAMY Store — Bootstrap Prompt

Copy everything below and paste it as your first message in a new Claude Code session inside /Users/ahmedhashem/MAMY-store/

---

Act as a Senior Full-Stack Architect. You are inside a fresh Nx monorepo for "MAMY Store" — an Arabic-first clothing e-commerce app for a boutique business. The workspace is already scaffolded with:

- **Angular 21 client** (`client/`) — SSR enabled, standalone components
- **NestJS 11 API** (`api/`) — webpack bundled
- **Shared models lib** (`libs/shared-models`) — imported as `@mamy/shared-models`
- **Spartan UI library** (`libs/ui/`) — copied from a sister project, includes: button, card, input, label, select, icon, alert-dialog, utils. Import from `@spartan-ng/helm/*`
- **Supabase** as the database (not TypeORM, not PostgreSQL Docker)
- All three projects build successfully (`nx build ui-helm`, `nx build client`, `nx build api`)

Read the `CLAUDE.md` first to understand all conventions (RTL-first, Signals, OKLCH theme, etc.).

## Phase 1 — Foundation Setup (Do this now)

### 1.1 Supabase Integration
- Install and configure `@supabase/supabase-js` in the API
- Create a `SupabaseModule` (NestJS) that reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `.env` via `ConfigService` and provides a Supabase client as an injectable service
- Create a `supabase.service.ts` on the client side that reads from `environment.ts` files (SUPABASE_URL + SUPABASE_ANON_KEY)
- Do NOT use TypeORM — use Supabase client SDK for all database operations

### 1.2 Shared Models (`libs/shared-models`)
Define these in `libs/shared-models/src/lib/shared-models.ts` and re-export from `index.ts`:

```typescript
// Enums
export enum UserRole { ADMIN = 'ADMIN', SELLER = 'SELLER' }
export enum OrderStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', CANCELLED = 'CANCELLED' }
export enum ProductCategory { DRESSES = 'DRESSES', ABAYAS = 'ABAYAS', HIJABS = 'HIJABS', ACCESSORIES = 'ACCESSORIES', SHOES = 'SHOES', BAGS = 'BAGS', OTHER = 'OTHER' }

// Interfaces
export interface IProduct { id: string; name: string; nameAr: string; description: string; descriptionAr: string; price: number; images: string[]; category: ProductCategory; sizes: string[]; colors: string[]; inStock: boolean; createdAt: string; }
export interface ICustomerDetails { name: string; phone: string; address: string; city: string; }
export interface IOrderItem { productId: string; name: string; quantity: number; unitPrice: number; size: string; color: string; }
export interface IOrder { id: string; customerDetails: ICustomerDetails; items: IOrderItem[]; total: number; status: OrderStatus; createdAt: string; }

// Egyptian phone validation
export const EGYPT_PHONE_RE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;
```

### 1.3 Auth Module (JWT + Passport)
- API: Create `AuthModule` with JWT strategy, `login` and `register` endpoints, bcrypt password hashing
- Use Supabase `auth.users` table OR a custom `users` table — your choice, but use Supabase client for queries
- Client: Create `auth.service.ts`, `auth.guard.ts` (functional `CanActivateFn`), `auth.interceptor.ts`, `error.interceptor.ts`
- Create login and register pages using Spartan UI components (card, input, label, button)
- All forms must use Angular Signals-based forms

### 1.4 Client App Shell & Routing
Set up the Angular client with route-based separation:

```
/                     → redirect to /store (public storefront)
/store                → StorefrontComponent (product grid)
/store/product/:id    → ProductDetailComponent
/cart                 → CartComponent
/checkout             → CheckoutComponent
/track/:id            → TrackingComponent (public order tracking)
/auth/login           → LoginComponent
/auth/register        → RegisterComponent
/admin                → AdminLayoutComponent (protected by authGuard)
/admin/dashboard      → DashboardComponent (stats overview)
/admin/products       → ProductsListComponent
/admin/products/new   → ProductFormComponent
/admin/products/:id   → ProductFormComponent (edit mode)
/admin/orders         → OrdersListComponent
/admin/orders/:id     → OrderDetailComponent
```

### 1.5 Tailwind + Theme Setup
Configure the client's `styles.scss` with Tailwind v4 + the OKLCH Zinc/Violet theme:
- Import Google Fonts: Inter + Cairo
- Set `dir="rtl"` and `lang="ar"` on `<html>` in `index.html`
- Configure the full OKLCH color palette (Zinc grays + Violet primary + Red destructive)
- Radius: `0.5rem`

### 1.6 i18n Setup
- Install and configure `@ngx-translate/core` + `@ngx-translate/http-loader`
- Create `client/public/assets/i18n/ar.json` and `en.json` with initial keys
- Create a `language.service.ts` that defaults to Arabic and persists choice in localStorage
- Arabic is the PRIMARY language — all keys should be written Arabic-first

## Phase 2 — Features (After Phase 1 is solid)

### 2.1 Admin Panel
- Product CRUD with image upload (Supabase Storage)
- Orders list with status management (PENDING → CONFIRMED → SHIPPED → DELIVERED)
- Dashboard with stats (total orders, revenue, product count)

### 2.2 Public Storefront
- Product grid with category filtering
- Product detail page with size/color selection
- Cart with quantity management
- Checkout with Egyptian phone validation
- Order tracking page

## Rules
- Read CLAUDE.md before writing any code — it has mandatory conventions
- RTL-first: use `ms-*`/`me-*`/`ps-*`/`pe-*` ONLY (never `ml-*`/`mr-*`)
- Signals everywhere — no RxJS for UI state
- `inject()` for DI — no constructor injection
- `@if`/`@for` control flow — no `*ngIf`/`*ngFor`
- All Spartan UI imports use `@spartan-ng/helm/*` path aliases
- Shared models first — define types before implementing features
- Use `input()`/`output()` signal APIs — no `@Input()`/`@Output()` decorators

Start with Phase 1. Work through each sub-task sequentially (1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6). After each sub-task, confirm completion before moving to the next.
