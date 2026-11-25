-- elloll — Customer Order Update & Cancel RPCs for AI Assistant + Chat Archive flag

alter table public.ai_conversations
  add column if not exists cleared_by_user boolean not null default false;

create or replace function public.mark_ai_session_cleared(p_session_id text)
returns void
language plpgsql
security definer
as $$
begin
  update public.ai_conversations
  set cleared_by_user = true
  where session_id = p_session_id;
end;
$$;

-- Customer Order Update RPC (verified by order_number + email, only while pending/processing)
create or replace function public.update_customer_order(
  p_order_number text,
  p_email text,
  p_delivery_address text default null,
  p_contact_number text default null,
  p_payment_method text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order public.orders%rowtype;
begin
  select o.* into v_order
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where upper(trim(o.order_number)) = upper(trim(p_order_number))
    and lower(trim(c.email)) = lower(trim(p_email));

  if not found then
    raise exception 'Order not found for that order number and email';
  end if;

  if v_order.status::text not in ('pending', 'confirmed') then
    raise exception 'Order cannot be modified because its status is %', v_order.status;
  end if;

  if p_payment_method is not null and p_payment_method not in ('cod', 'ewallet', 'bank_transfer') then
    raise exception 'Invalid payment method';
  end if;

  update public.orders
  set delivery_address = coalesce(nullif(trim(p_delivery_address), ''), delivery_address),
      payment_method = coalesce(nullif(trim(p_payment_method), '')::payment_method, payment_method),
      notes = coalesce(p_notes, notes)
  where id = v_order.id
  returning * into v_order;

  if p_contact_number is not null and trim(p_contact_number) <> '' then
    update public.customers
    set contact_number = trim(p_contact_number)
    where id = v_order.customer_id;
  end if;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'delivery_address', v_order.delivery_address,
    'payment_method', v_order.payment_method,
    'notes', v_order.notes,
    'total_amount', v_order.total_amount
  );
end;
$$;

-- Customer Order Cancel/Delete RPC (verified by order_number + email, restores stock)
create or replace function public.cancel_customer_order(
  p_order_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select o.* into v_order
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where upper(trim(o.order_number)) = upper(trim(p_order_number))
    and lower(trim(c.email)) = lower(trim(p_email));

  if not found then
    raise exception 'Order not found for that order number and email';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('order_number', v_order.order_number, 'status', 'cancelled', 'already_cancelled', true);
  end if;

  if v_order.status::text not in ('pending', 'confirmed') then
    raise exception 'Order cannot be cancelled because its status is %', v_order.status;
  end if;

  -- Restore stock for all items in this order
  for v_item in
    select product_id, quantity from public.order_items where order_id = v_order.id
  loop
    if v_item.product_id is not null then
      update public.products
      set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  update public.orders
  set status = 'cancelled'
  where id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', 'cancelled',
    'stock_restored', true
  );
end;
$$;

grant execute on function public.mark_ai_session_cleared(text) to anon, authenticated;
grant execute on function public.update_customer_order(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.cancel_customer_order(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
