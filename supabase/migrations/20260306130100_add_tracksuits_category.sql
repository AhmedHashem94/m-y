-- Add TRACKSUITS category
alter table public.products
  drop constraint products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('DRESSES','ABAYAS','HIJABS','TSHIRTS','HOODIES','PANTS','SHIRTS','JACKETS','SHORTS','TRACKSUITS','ACCESSORIES','SHOES','BAGS','OTHER'));
