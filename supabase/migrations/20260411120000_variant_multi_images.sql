-- Migrate product_variants from single image (text) to multiple images (text[])

-- 1. Add new images column
ALTER TABLE public.product_variants
  ADD COLUMN images text[] NOT NULL DEFAULT '{}';

-- 2. Migrate existing data: wrap single image into array
UPDATE public.product_variants
  SET images = ARRAY[image]
  WHERE image IS NOT NULL AND image != '';

-- 3. Drop old column
ALTER TABLE public.product_variants
  DROP COLUMN image;
