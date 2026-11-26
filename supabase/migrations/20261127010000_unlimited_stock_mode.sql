-- Unlimited stock mode: default stock_quantity to 999999 and remove order stock count checks/deductions

alter table public.products
  alter column stock_quantity set default 999999;

update public.products
set stock_quantity = 999999
where stock_quantity < 999999;

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
    where id = v_item.product_id;

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

    v_subtotal := v_subtotal + v_product.price * v_item.quantity;
  end loop;

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
    where id = v_item.product_id;

    if not found then
      raise exception 'Product % vanished during checkout', v_item.product_id;
    end if;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_item.quantity, v_product.price);
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
