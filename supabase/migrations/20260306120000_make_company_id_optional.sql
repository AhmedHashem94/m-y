-- Make company_id optional on products table
alter table public.products
  alter column company_id drop not null;
