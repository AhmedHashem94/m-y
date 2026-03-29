-- Add status column to products table (DRAFT / PUBLISHED)
-- Existing products default to PUBLISHED for backward compatibility
alter table public.products
  add column status text not null default 'PUBLISHED'
  check (status in ('DRAFT', 'PUBLISHED'));

-- Index for filtering published products on the storefront
create index idx_products_status on public.products (status);
