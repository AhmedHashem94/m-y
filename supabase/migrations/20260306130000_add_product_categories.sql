-- Add new product categories: TSHIRTS, HOODIES, PANTS, SHIRTS, JACKETS, SHORTS
alter table public.products
  drop constraint products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('DRESSES','ABAYAS','HIJABS','TSHIRTS','HOODIES','PANTS','SHIRTS','JACKETS','SHORTS','ACCESSORIES','SHOES','BAGS','OTHER'));
