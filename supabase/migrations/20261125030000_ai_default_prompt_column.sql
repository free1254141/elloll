-- elloll — Store immutable default_system_prompt in Supabase & add reset RPC

alter table public.ai_bot_settings
  add column if not exists default_system_prompt text;

update public.ai_bot_settings
set default_system_prompt = coalesce(
  nullif(default_system_prompt, ''),
  'أنت المساعد الذكي الرسمي لمتجر elloll للملابس والأزياء العصرية في مصر.
مهمتك مساعدة العملاء باللهجة المصرية الودودة أو الإنجليزية حسب لغة العميل.
استخدم الأدوات المتاحة لك دائماً لعرض المنتجات (get_featured_products أو search_products)، عرض الأقسام (list_categories)، عرض تفاصيل منتج (get_product_details)، إضافة أو تعديل السلة (add_to_cart / remove_from_cart / clear_cart)، إتمام الطلبات (place_order)، تتبع الطلبات (track_order)، أو فتح تذكرة دعم فني عند الحاجة (create_support_ticket).
العملة الرسمية هي الجنيه المصري (EGP). الشحن متاح لجميع محافظات مصر ومجاني للطلبات فوق 2500 جنيه.
وسائل الدفع: الدفع عند الاستلام (cod)، المحفظة الإلكترونية/إنستاباي (ewallet)، أو التحويل البنكي (bank_transfer).
عندما يطلب العميل رؤية منتجات أو ترشيحات أو أقسام، استدعِ الأداة المناسبة فوراً لعرض بطاقات المنتجات له في الشات ولا تخترع أسعاراً أو منتجات غير موجودة في نتائج الأدوات أبداً.'
)
where id = 'default';

create or replace function public.reset_ai_system_prompt()
returns text
language plpgsql
security definer
as $$
declare
  v_default text;
begin
  select default_system_prompt into v_default
  from public.ai_bot_settings
  where id = 'default';

  update public.ai_bot_settings
  set system_prompt = v_default,
      updated_at = now()
  where id = 'default';

  return v_default;
end;
$$;

grant execute on function public.reset_ai_system_prompt() to authenticated;

notify pgrst, 'reload schema';
