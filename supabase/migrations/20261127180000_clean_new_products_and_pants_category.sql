-- Add Pants & Sweatpants category and refine T-Shirts & Shirts name
INSERT INTO public.categories (name, slug)
VALUES ('بنطلونات وسويت بانتس', 'pants-jeans')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.categories
SET name = 'تيشيرتات وقمصان'
WHERE slug = 'tshirts-tops';

-- 1. Blue long-sleeve button-down men's shirt
UPDATE public.products
SET
  name = 'قميص رجالي أزرق بأكمام طويلة',
  category_id = (SELECT id FROM public.categories WHERE slug = 'tshirts-tops' LIMIT 1),
  description = 'قميص رجالي كلاسيك بأكمام طويلة وياقة بأزرار باللون الأزرق الأنيق، مصنوع من خامة قطنية مريحة للعمل والمناسبات والإطلالات السمارت كاجوال.',
  seo_title = 'قميص رجالي أزرق بأكمام طويلة | elloll',
  seo_description = 'اشتري قميص رجالي أزرق بأكمام طويلة وياقة بأزرار قطن مريح بسعر 350 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'قميص رجالي أزرق, قميص كم طويل, قميص سمارت كاجوال, ملابس رجالي مصر, قمصان قطن, elloll, blue long sleeve shirt'
WHERE id = '7b7a2778-4538-4122-b87c-5d3323337383';

-- 2. Dark blue washed denim half-zip hoodie
UPDATE public.products
SET
  name = 'هودي جينز مغسول أزرق داكن نصف سحاب',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'هودي عصري بقصة مريحة ونصف سحاب (Half-Zip) من قماش الجينز المغسول باللون الأزرق الداكن مع جيب أمامي واسع، مثالي لإطلالة ستريت وير مميزة.',
  seo_title = 'هودي جينز مغسول أزرق داكن نصف سحاب | elloll',
  seo_description = 'تسوق هودي جينز مغسول أزرق داكن نصف سحاب بجيب أمامي واسع وخامة ممتازة بسعر 700 جنيه من elloll، توصيل سريع لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'هودي جينز مغسول, هودي نصف سحاب, هودي أزرق داكن, ستريت وير مصر, هوديز شبابي, elloll, washed denim half zip hoodie'
WHERE id = '1d6d6813-f535-4033-879c-d5434243e180';

-- 3. Navy athletic sweatpants
UPDATE public.products
SET
  name = 'بنطلون سويت بانت كحلي رياضي',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون سويت بانتس رجالي كحلي بقصة عملية مريحة وخصر مطاطي، مناسب للارتداء اليومي والجيم والخروجات الكاجوال.',
  seo_title = 'بنطلون سويت بانت كحلي رياضي | elloll',
  seo_description = 'اطلب بنطلون سويت بانتس رياضي كحلي قطن مريح بسعر 400 جنيه من متجر elloll، مثالي للنادي والخروجات مع دفع عند الاستلام وشحن لجميع محافظات مصر.',
  seo_keywords = 'بنطلون سويت بانت كحلي, بنطلون رياضي كحلي, شروال رجالي, سويت بانتس مصر, ملابس رياضية, elloll, navy sweatpants mens'
WHERE id = '31e4ca33-3d43-488c-a3fb-8846ca393cf5';

-- 4. Straight-fit black sweatpants
UPDATE public.products
SET
  name = 'بنطلون رياضي أسود بقصة مستقيمة',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون رياضي أسود بقصة مستقيمة عصرية وخصر مطاطي مع رباط قابل للتعديل، خامة قطن ناعمة تمنحك حرية حركة وأناقة يومية.',
  seo_title = 'بنطلون رياضي أسود بقصة مستقيمة | elloll',
  seo_description = 'اشتري بنطلون رياضي أسود بقصة مستقيمة وخصر مطاطي بسعر 450 جنيه من elloll، خامة مريحة وتوصيل سريع لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'بنطلون رياضي أسود, سويت بانتس أسود, بنطلون قصة مستقيمة, ملابس كاجوال رجالي مصر, elloll, black straight sweatpants'
WHERE id = 'e2e4ee5b-b7a4-4938-9fe2-02005fc73245';

-- 5. Dark grey wide-leg sweatpants
UPDATE public.products
SET
  name = 'بنطلون سويت بانتس رمادي داكن واسع',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون سويت بانتس رجالي باللون الرمادي الداكن بقصة واسعة مريحة وخامة قطنية متينة تناسب الستايل الشبابي الحديث.',
  seo_title = 'بنطلون سويت بانتس رمادي داكن واسع | elloll',
  seo_description = 'تسوق بنطلون سويت بانتس رمادي داكن بقصة واسعة عصرية بسعر 450 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'سويت بانتس رمادي واسع, بنطلون أوفرسايز رجالي, بنطلون رياضي رمادي, ستريت وير مصر, elloll, dark grey wide sweatpants'
WHERE id = '994886a5-303a-44ab-8636-43531365547f';

-- 6. Brown and off-white horizontally striped pullover
UPDATE public.products
SET
  name = 'بلوفر رجالي مخطط بني وأوف وايت',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'بلوفر شتوي رجالي مخطط أفقياً باللونين البني والأوف وايت بياقة دائرية وأطراف مضلعة بنية، يمنحك دفئاً وأناقة كلاسيكية طوال الموسم.',
  seo_title = 'بلوفر رجالي مخطط بني وأوف وايت | elloll',
  seo_description = 'اشتري بلوفر شتوي رجالي مخطط بني وأوف وايت بخامة دافئة ومريحة بسعر 550 جنيه من elloll، شحن لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'بلوفر مخطط بني, سويت شيرت بني وأوف وايت, بلوفر شتوي رجالي, ملابس شتوية مصر, elloll, brown off-white striped pullover'
WHERE id = '0e4da844-0e54-4288-9bf9-e253e891d50c';

-- 7. Clean solid white sweatshirt
UPDATE public.products
SET
  name = 'سويت شيرت رجالي أبيض سادة',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'سويت شيرت رجالي أبيض سادة بتصميم بسيط وياقة دائرية من القطن المصري الناعم، قطعة أساسية سهلة التنسيق مع الجينز أو السويت بانتس.',
  seo_title = 'سويت شيرت رجالي أبيض سادة قطن | elloll',
  seo_description = 'تسوق سويت شيرت رجالي أبيض سادة قطن ناعم وعملي بسعر 450 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'سويت شيرت أبيض سادة, سويت شيرت قطن رجالي, ملابس رجالية أساسية, سويت شيرت كاجوال مصر, elloll, solid white sweatshirt'
WHERE id = '0ae7f949-9f7a-44ff-85a3-15f8166c79a9';

-- 8. White sweatshirt with black tiger graphic print
UPDATE public.products
SET
  name = 'سويت شيرت أبيض بطبعة نمر أسود',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'سويت شيرت رجالي أبيض بأكمام طويلة وياقة دائرية مع تفاصيل مثلثة سوداء عند الرقبة وطبعة نمر جريئة باللون الأسود لإطلالة شبابية لافتة.',
  seo_title = 'سويت شيرت أبيض بطبعة نمر أسود | elloll',
  seo_description = 'اطلب سويت شيرت أبيض بطبعة نمر أسود وتصميم شبابي عصري بسعر 400 جنيه من elloll، خامة قطن مريحة مع دفع عند الاستلام وشحن لكل مصر.',
  seo_keywords = 'سويت شيرت أبيض مطبوع, سويت شيرت بطبعة نمر, ملابس شبابية مصر, سويت شيرت كاجوال, elloll, white tiger print sweatshirt'
WHERE id = '9188ebda-49b1-4074-ba71-a118ec936c7d';

-- 9. Grey Trapstar graphic sweatpants
UPDATE public.products
SET
  name = 'بنطلون رياضي رمادي بطبعة Trapstar',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون رياضي رمادي بتصميم ستريت وير يحمل شعار Trapstar بخط قوطي أسود مقوس في الأمام وطباعة عمودية أنيقة على الساق، بخامة قطنية مريحة.',
  seo_title = 'بنطلون رياضي رمادي بطبعة Trapstar | elloll',
  seo_description = 'تسوق بنطلون رياضي رمادي بطبعة Trapstar ستريت وير عصري بسعر 400 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'بنطلون رمادي Trapstar, سويت بانتس مطبوع, ستريت وير مصر, بنطلون رياضي شبابي, elloll, grey trapstar sweatpants'
WHERE id = '8e8ab3f1-a087-44fe-bc3d-240020ea267a';

-- 10. Black wide-leg Trapstar sweatpants
UPDATE public.products
SET
  name = 'بنطلون رياضي أسود واسع بطبعة Trapstar',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون رياضي أسود بقصة أرجل واسعة مريحة، مزين بطبعة Trapstar البيضاء المنحنية في الأمام وطباعة جانبية مميزة لإطلالة كاجوال عصرية.',
  seo_title = 'بنطلون رياضي أسود واسع بطبعة Trapstar | elloll',
  seo_description = 'اشتري بنطلون رياضي أسود واسع الساقين بطبعة Trapstar البيضاء بسعر 400 جنيه من elloll، توصيل لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'بنطلون أسود واسع Trapstar, سويت بانتس أوفرسايز, بنطلون ستريت وير مصر, بنطلون رياضي أسود, elloll, black wide leg trapstar pants'
WHERE id = '4cd9c64e-3afe-4588-8741-d6fe9b2f0af8';

-- 11. Distressed slim-fit mid-wash blue jeans
UPDATE public.products
SET
  name = 'بنطلون جينز أزرق سليم فت ممزق',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون جينز رجالي أزرق بدرجة غسيل متوسطة وقصة سليم فت مدببة مع تفاصيل ممزقة ومهترئة عصرية تناسب الإطلالات اليومية والشبابية.',
  seo_title = 'بنطلون جينز أزرق سليم فت ممزق | elloll',
  seo_description = 'تسوق بنطلون جينز أزرق سليم فت ممزق بخامة دينيم متينة ومريحة بسعر 500 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'بنطلون جينز أزرق ممزق, جينز سليم فت رجالي, بناطيل جينز شبابي مصر, جينز كاجوال, elloll, blue distressed slim jeans'
WHERE id = '7788133c-4713-40ed-a451-705c9e847cfc';

-- 12. Light grey athletic jogger sweatpants
UPDATE public.products
SET
  name = 'بنطلون جوجر رياضي رمادي فاتح',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون جوجر رياضي رجالي باللون الرمادي الفاتح مع خصر مطاطي وتصميم عملي خفيف يناسب المشي والتمارين واللبس الكاجوال اليومي.',
  seo_title = 'بنطلون جوجر رياضي رمادي فاتح | elloll',
  seo_description = 'اطلب بنطلون جوجر رياضي رمادي فاتح مريح وعملي للاستخدام اليومي بسعر 450 جنيه من elloll، شحن لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'بنطلون جوجر رمادي فاتح, سويت بانتس رجالي, بنطلون رياضي كاجوال, ملابس رياضية مصر, elloll, light grey jogger pants'
WHERE id = '6ad0b967-ea99-40fd-8c04-4c2dd577693c';

-- 13. Wide-leg baggy denim jeans
UPDATE public.products
SET
  name = 'بنطلون جينز باجي واسع',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون جينز باجي رجالي بقصة واسعة مريحة مستوحاة من أسلوب الستريت وير، مصنوع من خامة دينيم عالية التحمل سهلة التنسيق مع الهوديز والتيشيرتات.',
  seo_title = 'بنطلون جينز باجي واسع رجالي | elloll',
  seo_description = 'اشتري بنطلون جينز باجي واسع بقصة مريحة وعصرية بسعر 450 جنيه من متجر elloll، توصيل سريع لجميع محافظات مصر ودفع عند الاستلام.',
  seo_keywords = 'بنطلون جينز باجي, جينز واسع رجالي, بناطيل وايد ليج مصر, ستريت وير جينز, elloll, wide baggy jeans mens'
WHERE id = '5feb6b10-ec69-4d06-ae66-7def4c10a807';

-- 14. Black jogger sweatpants with white side stripes
UPDATE public.products
SET
  name = 'بنطلون سويت بانتس أسود بخطوط جانبية',
  category_id = (SELECT id FROM public.categories WHERE slug = 'pants-jeans' LIMIT 1),
  description = 'بنطلون سويت بانتس رياضي أسود برباط أبيض على الخصر وخطوط جانبية بيضاء منحنية مع رقم مطبوع على الساقين وأساور مطاطية أنيقة عند الكاحل.',
  seo_title = 'بنطلون سويت بانتس أسود بخطوط جانبية | elloll',
  seo_description = 'تسوق بنطلون سويت بانتس أسود بخطوط جانبية بيضاء وأساور كاحل مطاطية بسعر 500 جنيه من elloll، دفع عند الاستلام وشحن لجميع محافظات مصر.',
  seo_keywords = 'سويت بانتس أسود بخطوط بيضاء, بنطلون جوجر بأساور, بنطلون رياضي شبابي مصر, elloll, black striped jogger sweatpants'
WHERE id = 'fab0a1a3-f677-47e4-a759-6810ff755531';

-- 15. White and orange tie-dye graphic hoodie
UPDATE public.products
SET
  name = 'هودي تاي داي أبيض وبرتقالي مطبوع',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'هودي شبابي بنمط صبغة الربط (تاي داي) باللون الأبيض مع تدرجات البرتقالي والرمادي الداكن وطباعة أمامية عصرية بقصة مريحة.',
  seo_title = 'هودي تاي داي أبيض وبرتقالي مطبوع | elloll',
  seo_description = 'اطلب هودي تاي داي أبيض وبرتقالي مطبوع بتصميم عصري فريد بسعر 350 جنيه من متجر elloll، دفع عند الاستلام وشحن سريع لجميع محافظات مصر.',
  seo_keywords = 'هودي تاي داي, هودي أبيض وبرتقالي, هوديز مطبوعة مصر, ملابس شبابية كاجوال, elloll, tie dye white orange hoodie'
WHERE id = '5136354d-540d-45c3-b8c2-339ca2fcb602';

-- 16. Off-white cream hoodie with embroidered chest logo
UPDATE public.products
SET
  name = 'هودي أوف وايت كريمي بشعار مطرز',
  category_id = (SELECT id FROM public.categories WHERE slug = 'hoodies-sweatshirts' LIMIT 1),
  description = 'هودي أوف وايت (كريمي) فاخر بقصة مريحة، مزود بقبعة بأربطة وجيب كانغرو أمامي وشعار صغير داكن مطرز بإتقان على الجهة اليسرى من الصدر.',
  seo_title = 'هودي أوف وايت كريمي بشعار مطرز | elloll',
  seo_description = 'تسوق هودي أوف وايت كريمي بقصة مريحة وشعار مطرز بسعر 750 جنيه من متجر elloll، خامة قطنية دافئة مع دفع عند الاستلام وشحن لكل مصر.',
  seo_keywords = 'هودي أوف وايت, هودي كريمي مطرز, هودي قطن فاخر مصر, هوديز رجالي أوفرسايز, elloll, cream embroidered hoodie'
WHERE id = 'b34c4188-1d52-4c83-907c-d884d3d7bb79';
