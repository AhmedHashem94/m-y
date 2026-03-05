-- ============================================================
-- MAMY Store: Initial Schema
-- Tables: companies, products, product_variants, orders
-- ============================================================

-- Use gen_random_uuid() which is built-in to PostgreSQL 13+

-- ── Companies (Brands) ──────────────────────────────────────

create table public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  name_ar    text not null,
  logo       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Anyone can read companies
create policy "companies_select" on public.companies
  for select using (true);

-- Only authenticated users (admins) can insert/update/delete
create policy "companies_insert" on public.companies
  for insert with check (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "companies_update" on public.companies
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "companies_delete" on public.companies
  for delete using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

-- ── Products ────────────────────────────────────────────────

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  name           text not null,
  name_ar        text not null,
  description    text not null default '',
  description_ar text not null default '',
  images         text[] not null default '{}',
  category       text not null check (category in ('DRESSES','ABAYAS','HIJABS','ACCESSORIES','SHOES','BAGS','OTHER')),
  gender         text not null check (gender in ('BOY','GIRL')),
  created_at     timestamptz not null default now()
);

create index idx_products_company on public.products(company_id);
create index idx_products_gender on public.products(gender);
create index idx_products_category on public.products(category);

alter table public.products enable row level security;

create policy "products_select" on public.products
  for select using (true);

create policy "products_insert" on public.products
  for insert with check (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "products_update" on public.products
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "products_delete" on public.products
  for delete using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

-- ── Product Variants (SKU-level) ────────────────────────────

create table public.product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  sku              text not null unique,
  price            numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price >= 0),
  stock            integer not null default 0 check (stock >= 0),
  attributes       jsonb not null default '{}',
  image            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index idx_variants_product on public.product_variants(product_id);
create index idx_variants_active on public.product_variants(is_active) where is_active = true;

alter table public.product_variants enable row level security;

create policy "variants_select" on public.product_variants
  for select using (true);

create policy "variants_insert" on public.product_variants
  for insert with check (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "variants_update" on public.product_variants
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "variants_delete" on public.product_variants
  for delete using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

-- ── Orders ──────────────────────────────────────────────────

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  customer_details jsonb not null,
  items            jsonb not null,
  total            numeric(10,2) not null check (total >= 0),
  status           text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED')),
  created_at       timestamptz not null default now()
);

create index idx_orders_status on public.orders(status);
create index idx_orders_created on public.orders(created_at desc);

alter table public.orders enable row level security;

-- Orders are publicly insertable (guest checkout) but only admins can read/update/delete
create policy "orders_insert" on public.orders
  for insert with check (true);

create policy "orders_select" on public.orders
  for select using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "orders_update" on public.orders
  for update using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "orders_delete" on public.orders
  for delete using (
    auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

-- ── Storage bucket for product images ───────────────────────

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "product_images_admin_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );

create policy "product_images_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
  );
