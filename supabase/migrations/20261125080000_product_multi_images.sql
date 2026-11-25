-- Support multiple product images stored in Supabase Storage (`product-images`)
-- Keeps `image_url` as primary cover image for backwards compatibility across cart, orders, and SEO

alter table public.products
  add column if not exists image_urls text[] not null default '{}'::text[];

update public.products
set image_urls = array[image_url]
where coalesce(array_length(image_urls, 1), 0) = 0
  and coalesce(image_url, '') <> '';
