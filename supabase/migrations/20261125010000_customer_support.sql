-- elloll — Customer Support system (tickets, live messages, guest RPCs, Admin RLS, Realtime)

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  order_number text,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  unread_by_admin boolean not null default true,
  unread_by_customer boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_last_message on public.support_tickets (last_message_at desc);
create index if not exists idx_support_tickets_status on public.support_tickets (status);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'admin')),
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket_created on public.support_messages (ticket_id, created_at asc);

create table if not exists public.support_pings (
  ticket_number text primary key,
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_pings enable row level security;

drop policy if exists "Admins manage support tickets" on public.support_tickets;
create policy "Admins manage support tickets"
  on public.support_tickets for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins manage support messages" on public.support_messages;
create policy "Admins manage support messages"
  on public.support_messages for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins manage support pings" on public.support_pings;
create policy "Admins manage support pings"
  on public.support_pings for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Anon can subscribe to support pings" on public.support_pings;
create policy "Anon can subscribe to support pings"
  on public.support_pings for select
  to anon, authenticated
  using (true);

create or replace function public.touch_support_ping()
returns trigger
language plpgsql
security definer
as $$
declare
  v_ticket_num text;
begin
  if tg_table_name = 'support_tickets' then
    v_ticket_num := new.ticket_number;
  else
    select ticket_number into v_ticket_num from public.support_tickets where id = new.ticket_id;
  end if;

  if v_ticket_num is not null then
    insert into public.support_pings (ticket_number, updated_at)
    values (v_ticket_num, now())
    on conflict (ticket_number) do update set updated_at = excluded.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_support_tickets_ping on public.support_tickets;
create trigger trg_support_tickets_ping
  after insert or update on public.support_tickets
  for each row execute function public.touch_support_ping();

drop trigger if exists trg_support_messages_ping on public.support_messages;
create trigger trg_support_messages_ping
  after insert on public.support_messages
  for each row execute function public.touch_support_ping();

create or replace function public.get_support_ticket(p_ticket_number text, p_email text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_result jsonb;
begin
  select * into v_ticket
  from public.support_tickets
  where upper(trim(ticket_number)) = upper(trim(p_ticket_number))
    and lower(trim(customer_email)) = lower(trim(p_email));

  if not found then
    return null;
  end if;

  if v_ticket.unread_by_customer then
    update public.support_tickets
    set unread_by_customer = false, updated_at = now()
    where id = v_ticket.id;
    v_ticket.unread_by_customer := false;
  end if;

  select jsonb_build_object(
    'id', v_ticket.id,
    'ticket_number', v_ticket.ticket_number,
    'customer_name', v_ticket.customer_name,
    'customer_email', v_ticket.customer_email,
    'order_number', v_ticket.order_number,
    'subject', v_ticket.subject,
    'status', v_ticket.status,
    'last_message_at', v_ticket.last_message_at,
    'created_at', v_ticket.created_at,
    'messages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'sender_role', m.sender_role,
        'sender_name', m.sender_name,
        'body', m.body,
        'created_at', m.created_at
      ) order by m.created_at asc), '[]'::jsonb)
      from public.support_messages m
      where m.ticket_id = v_ticket.id
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.create_support_ticket(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_order_number text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ticket_id uuid;
  v_ticket_num text;
  v_clean_name text := trim(coalesce(p_name, ''));
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_clean_subject text := trim(coalesce(p_subject, ''));
  v_clean_msg text := trim(coalesce(p_message, ''));
  v_clean_order text := nullif(trim(coalesce(p_order_number, '')), '');
begin
  if v_clean_name = '' or v_clean_email = '' or v_clean_subject = '' or v_clean_msg = '' then
    raise exception 'All required support fields must be provided';
  end if;

  v_ticket_num := 'SUP-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  insert into public.support_tickets (
    ticket_number, customer_name, customer_email, order_number, subject, status, unread_by_admin, unread_by_customer
  ) values (
    v_ticket_num, v_clean_name, v_clean_email, v_clean_order, v_clean_subject, 'open', true, false
  )
  returning id into v_ticket_id;

  insert into public.support_messages (ticket_id, sender_role, sender_name, body)
  values (v_ticket_id, 'customer', v_clean_name, v_clean_msg);

  return public.get_support_ticket(v_ticket_num, v_clean_email);
end;
$$;

create or replace function public.add_customer_support_message(
  p_ticket_number text,
  p_email text,
  p_body text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ticket public.support_tickets%rowtype;
  v_clean_body text := trim(coalesce(p_body, ''));
begin
  if v_clean_body = '' then
    raise exception 'Message cannot be empty';
  end if;

  select * into v_ticket
  from public.support_tickets
  where upper(trim(ticket_number)) = upper(trim(p_ticket_number))
    and lower(trim(customer_email)) = lower(trim(p_email));

  if not found then
    raise exception 'Ticket not found';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'This ticket is closed';
  end if;

  insert into public.support_messages (ticket_id, sender_role, sender_name, body)
  values (v_ticket.id, 'customer', v_ticket.customer_name, v_clean_body);

  update public.support_tickets
  set unread_by_admin = true,
      status = case when status = 'resolved' then 'open' else status end,
      last_message_at = now(),
      updated_at = now()
  where id = v_ticket.id;

  return public.get_support_ticket(v_ticket.ticket_number, v_ticket.customer_email);
end;
$$;

grant all on public.support_tickets to anon, authenticated, service_role;
grant all on public.support_messages to anon, authenticated, service_role;
grant all on public.support_pings to anon, authenticated, service_role;
grant execute on function public.get_support_ticket(text, text) to anon, authenticated;
grant execute on function public.create_support_ticket(text, text, text, text, text) to anon, authenticated;
grant execute on function public.add_customer_support_message(text, text, text) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_tickets'
  ) then
    alter publication supabase_realtime add table public.support_tickets;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_messages'
  ) then
    alter publication supabase_realtime add table public.support_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_pings'
  ) then
    alter publication supabase_realtime add table public.support_pings;
  end if;
end $$;

notify pgrst, 'reload schema';
