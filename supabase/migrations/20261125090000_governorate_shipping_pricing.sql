-- Governorate-based smart shipping pricing & order shipping fee snapshot

create table if not exists public.shipping_settings (
  id text primary key default 'default',
  free_shipping_threshold numeric(10, 2) not null default 2500,
  zone_rates jsonb not null default '{"cairo_giza":50,"alex_delta_canal":65,"upper_egypt":85,"frontier":110}'::jsonb,
  governorate_rates jsonb not null default '{
    "cairo":50,"giza":50,"qalyubia":50,
    "alexandria":65,"dakahlia":65,"sharqia":65,"gharbia":65,"monufia":65,"beheira":65,"kafr_el_sheikh":65,"damietta":65,"port_said":65,"ismailia":65,"suez":65,
    "fayoum":85,"beni_suef":85,"minya":85,"asyut":85,"sohag":85,"qena":85,"luxor":85,"aswan":85,
    "red_sea":110,"matrouh":110,"new_valley":110,"north_sinai":110,"south_sinai":110
  }'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.shipping_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.shipping_settings enable row level security;

drop policy if exists "Anyone reads shipping_settings" on public.shipping_settings;
create policy "Anyone reads shipping_settings"
  on public.shipping_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage shipping_settings" on public.shipping_settings;
create policy "Admins manage shipping_settings"
  on public.shipping_settings for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter table public.orders
  add column if not exists governorate text,
  add column if not exists shipping_fee numeric(10, 2) not null default 0;

create or replace function public.place_order(
  p_full_name text,
  p_email text,
  p_contact_number text,
  p_delivery_address text,
  p_payment_method text,
  p_items jsonb,
  p_notes text default null,
  p_governorate text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10, 2) := 0;
  v_shipping_fee numeric(10, 2) := 0;
  v_free_threshold numeric(10, 2) := 2500;
  v_gov_rates jsonb := '{}'::jsonb;
  v_gov_clean text := nullif(trim(coalesce(p_governorate, '')), '');
  v_total numeric(10, 2) := 0;
  v_day_counter integer;
  v_attempt integer;
  v_item record;
  v_product public.products%rowtype;
  v_issues jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION', 'message', 'سلة التسوق فارغة.');
  end if;

  if nullif(trim(p_full_name), '') is null
     or nullif(trim(p_email), '') is null
     or nullif(trim(p_contact_number), '') is null
     or nullif(trim(p_delivery_address), '') is null then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION',
      'message', 'الاسم والبريد الإلكتروني ورقم الهاتف والعنوان مطلوبة.');
  end if;

  if p_payment_method not in ('cod', 'ewallet', 'bank_transfer') then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION',
      'message', 'اختر طريقة دفع صحيحة.');
  end if;

  if p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION',
      'message', 'أدخل بريداً إلكترونياً صحيحاً.');
  end if;

  if jsonb_array_length(p_items) > 100 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION',
      'message', 'عدد المنتجات في السلة كبير جداً.');
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int)
    group by product_id
    having count(*) > 1
  ) then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION',
      'message', 'السلة تحتوي على منتج مكرر.');
  end if;

  for v_item in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int)
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
      return jsonb_build_object('ok', false, 'code', 'VALIDATION',
        'message', 'كمية كل منتج يجب أن تكون 1 على الأقل.');
    end if;

    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      return jsonb_build_object('ok', false, 'code', 'PRODUCT_UNAVAILABLE',
        'message', 'أحد المنتجات في السلة لم يعد متاحاً.',
        'items', jsonb_build_array(jsonb_build_object(
          'product_id', v_item.product_id,
          'name', 'منتج غير متاح',
          'requested', v_item.quantity
        )));
    end if;

    if v_product.status <> 'active' then
      return jsonb_build_object('ok', false, 'code', 'PRODUCT_UNAVAILABLE',
        'message', format('المنتج "%s" لم يعد متاحاً.', v_product.name),
        'items', jsonb_build_array(jsonb_build_object(
          'product_id', v_product.id,
          'name', v_product.name,
          'requested', v_item.quantity
        )));
    end if;

    if v_product.stock_quantity < v_item.quantity then
      v_issues := v_issues || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'available', v_product.stock_quantity,
        'requested', v_item.quantity
      );
    end if;

    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
  end loop;

  if jsonb_array_length(v_issues) > 0 then
    return jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_STOCK',
      'message', 'بعض المنتجات لا يتوفر لها مخزون كافٍ.',
      'items', v_issues);
  end if;

  -- Compute authoritative shipping fee from shipping_settings
  if v_gov_clean is not null then
    select coalesce(free_shipping_threshold, 2500), coalesce(governorate_rates, '{}'::jsonb)
    into v_free_threshold, v_gov_rates
    from public.shipping_settings
    where id = 'default';

    if v_free_threshold > 0 and v_subtotal >= v_free_threshold then
      v_shipping_fee := 0;
    else
      v_shipping_fee := greatest(0, coalesce((v_gov_rates ->> v_gov_clean)::numeric, 0));
    end if;
  end if;

  v_total := v_subtotal + v_shipping_fee;

  insert into public.customers (full_name, email, contact_number)
  values (trim(p_full_name), lower(trim(p_email)), trim(p_contact_number))
  on conflict (email) do update
    set full_name = excluded.full_name,
        contact_number = excluded.contact_number
  returning id into v_customer_id;

  for v_attempt in 1..3 loop
    insert into public.order_number_counters (day, last_value)
    values (current_date, 1)
    on conflict (day) do update
      set last_value = public.order_number_counters.last_value + 1
    returning last_value into v_day_counter;

    v_order_number := 'ORD-' || to_char(current_date, 'YYYYMMDD')
      || '-' || lpad(v_day_counter::text, 4, '0');

    begin
      insert into public.orders (
        order_number, customer_id, delivery_address, payment_method,
        status, total_amount, notes, governorate, shipping_fee
      )
      values (
        v_order_number, v_customer_id, trim(p_delivery_address),
        p_payment_method::public.payment_method, 'pending', v_total,
        nullif(trim(coalesce(p_notes, '')), ''), v_gov_clean, v_shipping_fee
      )
      returning id into v_order_id;

      exit;
    exception
      when unique_violation then
        v_order_number := null;
    end;
  end loop;

  if v_order_number is null then
    raise exception 'Could not allocate a unique order number';
  end if;

  for v_item in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int)
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'Product % vanished during checkout', v_item.product_id;
    end if;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_item.quantity, v_product.price);

    update public.products
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_product.id;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'governorate', v_gov_clean,
    'total_amount', v_total
  );
end;
$$;

drop view if exists public.order_details;

create view public.order_details
with (security_invoker = true) as
select
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.shipping_fee,
  o.governorate,
  o.notes,
  o.created_at,
  o.delivery_address,
  o.payment_method,
  c.full_name as customer_name,
  c.email as customer_email,
  c.contact_number as customer_contact_number,
  coalesce(items.items, '[]'::jsonb) as items
from public.orders o
left join public.customers c on c.id = o.customer_id
left join (
  select
    oi.order_id,
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'image_url', p.image_url,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price
      ) order by oi.created_at, oi.id
    ) as items
  from public.order_items oi
  left join public.products p on p.id = oi.product_id
  group by oi.order_id
) items on items.order_id = o.id;

revoke all on public.order_details from public;
grant select on public.order_details to authenticated;

revoke all on function public.place_order(text, text, text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, text, text) to anon, authenticated;
