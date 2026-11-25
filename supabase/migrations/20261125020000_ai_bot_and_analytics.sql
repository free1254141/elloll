-- elloll — AI Assistant settings, conversations, daily analytics & Telegram integration

create table if not exists public.ai_bot_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  mode text not null default 'default' check (mode in ('default', 'chat_only')),
  bot_name text not null default 'مساعد elloll الذكي',
  welcome_message text not null default 'أهلاً بك في elloll! أنا مساعدك الذكي للأزياء والملابس في مصر. أقدر أساعدك تبحث عن أي منتج، تفلتر الأسعار، تضيف للسلة، تأكد طلبك، أو تتابع شحنتك فوراً!',
  system_prompt text not null default 'أنت المساعد الذكي الرسمي لمتجر elloll للملابس والأزياء العصرية في مصر.
مهمتك مساعدة العملاء باللهجة المصرية الودودة أو الإنجليزية حسب لغة العميل.
استخدم الأدوات المتاحة لك دائماً للبحث في المنتجات والأقسام، إضافة أو تعديل السلة، إتمام الطلبات، تتبع الطلبات، أو فتح تذكرة دعم فني عند الحاجة.
العملة الرسمية هي الجنيه المصري (EGP). الشحن متاح لجميع محافظات مصر ومجاني للطلبات فوق 2500 جنيه.
وسائل الدفع: الدفع عند الاستلام (cod)، المحفظة الإلكترونية/إنستاباي (ewallet)، أو التحويل البنكي (bank_transfer).
لا تخترع أسعاراً أو منتجات غير موجودة في نتائج الأدوات أبداً.',
  deepseek_model text not null default 'deepseek-chat',
  telegram_chat_id text not null default '',
  notify_support_telegram boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.ai_bot_settings (id)
values ('default')
on conflict (id) do nothing;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  visitor_id text not null,
  customer_name text,
  message_count int not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_last_msg on public.ai_conversations (last_message_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conv_created on public.ai_messages (conversation_id, created_at asc);

create table if not exists public.daily_analytics (
  day date not null default current_date,
  visitor_id text not null,
  visited_site boolean not null default false,
  used_chat boolean not null default false,
  page_views int not null default 0,
  chat_messages int not null default 0,
  primary key (day, visitor_id)
);

alter table public.ai_bot_settings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.daily_analytics enable row level security;

drop policy if exists "Admins manage ai_bot_settings" on public.ai_bot_settings;
create policy "Admins manage ai_bot_settings"
  on public.ai_bot_settings for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins manage ai_conversations" on public.ai_conversations;
create policy "Admins manage ai_conversations"
  on public.ai_conversations for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins manage ai_messages" on public.ai_messages;
create policy "Admins manage ai_messages"
  on public.ai_messages for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins manage daily_analytics" on public.daily_analytics;
create policy "Admins manage daily_analytics"
  on public.daily_analytics for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public safe config RPC (never exposes API keys)
create or replace function public.get_public_ai_config()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row public.ai_bot_settings%rowtype;
begin
  select * into v_row from public.ai_bot_settings where id = 'default';
  if not found then
    return jsonb_build_object(
      'enabled', true,
      'mode', 'default',
      'bot_name', 'مساعد elloll الذكي',
      'welcome_message', 'أهلاً بك في elloll!'
    );
  end if;

  return jsonb_build_object(
    'enabled', v_row.enabled,
    'mode', v_row.mode,
    'bot_name', v_row.bot_name,
    'welcome_message', v_row.welcome_message,
    'system_prompt', v_row.system_prompt,
    'deepseek_model', v_row.deepseek_model
  );
end;
$$;

-- Track daily unique site visitors & chat users
create or replace function public.track_visitor_event(
  p_visitor_id text,
  p_event_type text default 'site'
)
returns void
language plpgsql
security definer
as $$
declare
  v_vid text := trim(coalesce(p_visitor_id, ''));
begin
  if v_vid = '' then
    return;
  end if;

  insert into public.daily_analytics (day, visitor_id, visited_site, used_chat, page_views, chat_messages)
  values (
    current_date,
    v_vid,
    p_event_type = 'site',
    p_event_type = 'chat',
    case when p_event_type = 'site' then 1 else 0 end,
    case when p_event_type = 'chat' then 1 else 0 end
  )
  on conflict (day, visitor_id) do update set
    visited_site = daily_analytics.visited_site or (p_event_type = 'site'),
    used_chat = daily_analytics.used_chat or (p_event_type = 'chat'),
    page_views = daily_analytics.page_views + case when p_event_type = 'site' then 1 else 0 end,
    chat_messages = daily_analytics.chat_messages + case when p_event_type = 'chat' then 1 else 0 end;
end;
$$;

-- Save AI conversation turn securely from guest chat
create or replace function public.save_ai_chat_turn(
  p_session_id text,
  p_visitor_id text,
  p_user_msg text,
  p_assistant_msg text,
  p_tool_calls jsonb default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_conv_id uuid;
begin
  insert into public.ai_conversations (session_id, visitor_id, message_count, last_message_at)
  values (p_session_id, p_visitor_id, 2, now())
  on conflict (session_id) do update set
    message_count = ai_conversations.message_count + 2,
    last_message_at = now()
  returning id into v_conv_id;

  insert into public.ai_messages (conversation_id, role, content)
  values (v_conv_id, 'user', p_user_msg);

  insert into public.ai_messages (conversation_id, role, content, tool_calls)
  values (v_conv_id, 'assistant', p_assistant_msg, p_tool_calls);

  perform public.track_visitor_event(p_visitor_id, 'chat');
end;
$$;

-- Owner analytics summary (for Admin Dashboard & Telegram bot)
create or replace function public.get_store_analytics_summary()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_site_today int;
  v_chat_today int;
  v_views_today int;
  v_chat_msgs_today int;
  v_orders_today int;
  v_revenue_today numeric;
  v_open_support int;
  v_total_convs int;
begin
  select
    count(*) filter (where visited_site),
    count(*) filter (where used_chat),
    coalesce(sum(page_views), 0),
    coalesce(sum(chat_messages), 0)
  into v_site_today, v_chat_today, v_views_today, v_chat_msgs_today
  from public.daily_analytics
  where day = current_date;

  select
    count(*),
    coalesce(sum(total_amount), 0)
  into v_orders_today, v_revenue_today
  from public.orders
  where created_at >= current_date::timestamptz;

  select count(*) into v_open_support
  from public.support_tickets
  where status in ('open', 'in_progress');

  select count(*) into v_total_convs
  from public.ai_conversations;

  return jsonb_build_object(
    'site_visitors_today', coalesce(v_site_today, 0),
    'chat_users_today', coalesce(v_chat_today, 0),
    'page_views_today', coalesce(v_views_today, 0),
    'chat_messages_today', coalesce(v_chat_msgs_today, 0),
    'orders_today', coalesce(v_orders_today, 0),
    'revenue_today', coalesce(v_revenue_today, 0),
    'open_support_tickets', coalesce(v_open_support, 0),
    'total_ai_conversations', coalesce(v_total_convs, 0)
  );
end;
$$;

grant all on public.ai_bot_settings to authenticated, service_role;
grant all on public.ai_conversations to authenticated, service_role;
grant all on public.ai_messages to authenticated, service_role;
grant all on public.daily_analytics to authenticated, service_role;

grant execute on function public.get_public_ai_config() to anon, authenticated;
grant execute on function public.track_visitor_event(text, text) to anon, authenticated;
grant execute on function public.save_ai_chat_turn(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_store_analytics_summary() to anon, authenticated;

notify pgrst, 'reload schema';
