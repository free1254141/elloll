-- Step 1: Insert core clothing collections idempotently
INSERT INTO public.categories (name, slug)
VALUES
  ('هوديز وسويت شيرتات', 'hoodies-sweatshirts'),
  ('أحذية وسنيكرز', 'shoes-sneakers'),
  ('تيشيرتات وبديهات', 'tshirts-tops'),
  ('أطقم رياضية', 'tracksuits')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Assign all active products to categories and populate SEO metadata
UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سويت شيرت أسود مطبوع شبكة عنكبوت | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اشتري سويت شيرت رجالي أسود مطبوع شبكة عنكبوت قطن مريح بسعر 500 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سويت شيرت أسود, سويت شيرت مطبوع, ملابس رجالي كاجوال, سويت شيرت قطن, تسوق ملابس مصر, elloll, black printed sweatshirt, streetwear egypt')
WHERE id = '2a560443-07cd-4ab0-a754-24564931cef2';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سويت شيرت بولو بيج نصف سحاب رجالي | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'تسوق سويت شيرت بولو رجالي بيج نصف سحاب بياقة سوداء وخامة عالية بسعر 400 جنيه من elloll، توصيل سريع لجميع محافظات مصر ودفع عند الاستلام.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سويت شيرت بولو, سويت شيرت بيج, سويت شيرت نصف سحاب, ملابس كاجوال رجالي, أزياء رجالية مصر, elloll, beige half zip polo sweatshirt')
WHERE id = 'c07238e8-8e64-4940-9c21-2e8c73f8fd8f';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'tracksuits' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'طقم رياضي رجالي أسود سادة كامل | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اطلب طقم رياضي رجالي أسود سادة قطن مكون من سويت شيرت وبنطلون بسعر 900 جنيه من elloll، مناسب للنادي والخروجات مع شحن لكل مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'طقم رياضي رجالي, ترينج رجالي أسود, سويت شيرت وبنطلون, ملابس رياضية مصر, طقم كاجوال, elloll, black mens tracksuit, gym wear egypt')
WHERE id = '0e837c96-01a2-4abd-b7e2-f0ceb9e37c2c';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'بلوفر شتوي رجالي مخطط أسود ورمادي | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'تألق بإطلالة دافئة مع بلوفر شتوي رجالي مخطط أسود ورمادي بسعر 450 جنيه من متجر elloll، خامة مريحة وتوصيل سريع لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'بلوفر شتوي رجالي, بلوفر مخطط, ملابس شتوية رجالي, بلوفر أسود ورمادي, موضة شتاء مصر, elloll, striped winter pullover')
WHERE id = '5959a798-3332-4118-b3cb-7fd9138df419';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سويت شيرت أوف وايت بخطوط جانبية | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اشتري سويت شيرت رجالي أوف وايت بياقة دائرية وخطوط جانبية بسعر 650 جنيه من elloll، خامة قطن ممتازة مع دفع عند الاستلام وشحن لكل مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سويت شيرت أوف وايت, سويت شيرت بخطوط, ملابس رجالية عصرية, سويت شيرت راوند, تسوق أونلاين مصر, elloll, off white sweatshirt')
WHERE id = '35ca9e4f-1dc7-4299-95ea-c70f3f66d59f';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'tshirts-tops' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'تيشيرت رجالي مخطط أبيض وأسود كم طويل | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'تسوق تيشيرت رجالي مخطط أبيض وأسود بأكمام طويلة وقطن ناعم بسعر 550 جنيه من متجر elloll، مثالي للإطلالات اليومية مع شحن لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'تيشيرت مخطط, تيشيرت أبيض وأسود, تيشيرت كم طويل رجالي, تيشيرت قطن, ملابس كاجوال مصر, elloll, black and white striped tshirt')
WHERE id = '37058af7-ef1c-4d7f-8d9a-d6d68031cefd';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'هودي أوفرسايز قطن مصري أسود مطبوع | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اطلب هودي أوفرسايز أسود من القطن المصري الفاخر بطبعة شبابية بسعر 500 جنيه من elloll، دفع عند الاستلام وتوصيل سريع لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'هودي أوفرسايز أسود, هودي قطن مصري, هوديز شبابي, ستريت وير مصر, هودي مطبوع, elloll, black oversize hoodie, egyptian cotton hoodie')
WHERE id = 'a7dc8eaa-635f-4964-a7fb-90fd1e473509';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'tshirts-tops' LIMIT 1)
WHERE id = 'ce0e24f3-bafe-4658-8505-36d8aa69b116';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'shoes-sneakers' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سنيكرز رياضي أبيض وبيج مريح | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'تسوق سنيكرز رياضي كاجوال أبيض وبيج منخفض ومريح للمشي والاستخدام اليومي بسعر 300 جنيه من متجر elloll مع توصيل لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سنيكرز أبيض وبيج, حذاء رياضي كاجوال, كوتشي رجالي مريح, أحذية رياضية مصر, سنيكرز يومي, elloll, beige white sneakers')
WHERE id = '62a7eb87-f45f-4554-8681-11fc5e289597';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'shoes-sneakers' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'حذاء كاجوال شبابي كلاسيك مريح | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اشتري حذاء كاجوال شبابي بتصميم كلاسيك عملي يناسب الخروجات اليومية بسعر 350 جنيه من elloll، دفع عند الاستلام وشحن سريع لكل المحافظات.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'حذاء كاجوال شبابي, شوز كلاسيك, أحذية رجالي مصر, حذاء مريح للخروج, كوتشي كاجوال, elloll, casual classic shoes')
WHERE id = '4f7b15d5-14c0-40ad-bb45-7bc23a378b3d';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'shoes-sneakers' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سنيكرز كاجوال يومي خفيف | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'احصل على سنيكرز كاجوال خفيف ومريح للاستخدام اليومي بسعر 300 جنيه من متجر elloll، تصميم عملي ودفع عند الاستلام مع شحن لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سنيكرز كاجوال, كوتشي يومي خفيف, أحذية كاجوال مصر, سنيكرز اقتصادي, شوز شبابي, elloll, daily casual sneakers')
WHERE id = '83317e23-c5ef-4eb5-914e-2ea8c1fa3d50';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'سويت شيرت راوند أوفرسايز سادة قطن | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'تسوق سويت شيرت راوند أوفرسايز سادة بقصة عصرية وخامة قطن مريحة بسعر 500 جنيه من متجر elloll، دفع عند الاستلام وشحن لجميع محافظات مصر.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'سويت شيرت أوفرسايز, سويت شيرت راوند سادة, ملابس أوفرسايز مصر, سويت شيرت قطن, ستريت وير, elloll, plain oversize crewneck')
WHERE id = 'b731b991-4ea9-4ed1-9015-698366101a55';

UPDATE public.products
SET
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  seo_title = COALESCE(NULLIF(BTRIM(seo_title), ''), 'هودي أوفرسايز قطن مصري فاخر | elloll'),
  seo_description = COALESCE(NULLIF(BTRIM(seo_description), ''), 'اشتري هودي أوفرسايز من القطن المصري الفاخر الدافئ والمريح للاستخدام اليومي بسعر 450 جنيه من elloll، توصيل لجميع محافظات مصر ودفع عند الاستلام.'),
  seo_keywords = COALESCE(NULLIF(BTRIM(seo_keywords), ''), 'هودي أوفرسايز, هودي قطن مصري, ملابس شتوية مصر, هودي كاجوال رجالي, هودي دافئ, elloll, egyptian cotton oversize hoodie')
WHERE id = '0fcec566-31fb-4b68-be00-f3afa09656d7';
