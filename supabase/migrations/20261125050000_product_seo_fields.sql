-- elloll — Per-product dynamic & AI-generated SEO metadata columns

alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text;

notify pgrst, 'reload schema';
