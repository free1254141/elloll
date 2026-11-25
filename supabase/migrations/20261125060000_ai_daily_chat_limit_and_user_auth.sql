-- elloll — Daily AI Chat Rate Limit (20 messages/day) & User-linked conversations

alter table public.ai_bot_settings
  add column if not exists daily_chat_limit int not null default 20;

alter table public.ai_conversations
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create table if not exists public.ai_daily_quota (
  day date not null default current_date,
  quota_key text not null,
  used_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, quota_key)
);

alter table public.ai_daily_quota enable row level security;

drop policy if exists "Admins manage ai_daily_quota" on public.ai_daily_quota;
create policy "Admins manage ai_daily_quota"
  on public.ai_daily_quota for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Update get_public_ai_config to include daily_chat_limit
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
      'welcome_message', 'أهلاً بك في elloll!',
      'daily_chat_limit', 20
    );
  end if;

  return jsonb_build_object(
    'enabled', v_row.enabled,
    'mode', v_row.mode,
    'bot_name', v_row.bot_name,
    'welcome_message', v_row.welcome_message,
    'system_prompt', v_row.system_prompt,
    'deepseek_model', v_row.deepseek_model,
    'daily_chat_limit', coalesce(v_row.daily_chat_limit, 20)
  );
end;
$$;

-- Helper: resolve active daily quota for current authenticated user or guest visitor
create or replace function public.check_ai_chat_quota(p_visitor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := 20;
  v_user_used int := 0;
  v_visitor_used int := 0;
  v_used int := 0;
begin
  select coalesce(daily_chat_limit, 20)
  into v_limit
  from public.ai_bot_settings
  where id = 'default';

  v_limit := greatest(1, coalesce(v_limit, 20));

  if v_uid is not null then
    select coalesce(used_count, 0) into v_user_used
    from public.ai_daily_quota
    where day = current_date and quota_key = 'u:' || v_uid::text;
  end if;

  if coalesce(trim(p_visitor_id), '') <> '' then
    select coalesce(used_count, 0) into v_visitor_used
    from public.ai_daily_quota
    where day = current_date and quota_key = 'v:' || trim(p_visitor_id);
  end if;

  v_used := greatest(coalesce(v_user_used, 0), coalesce(v_visitor_used, 0));

  return jsonb_build_object(
    'daily_limit', v_limit,
    'used_today', v_used,
    'remaining', greatest(0, v_limit - v_used),
    'allowed', v_used < v_limit
  );
end;
$$;

-- Update save_ai_chat_turn to increment both visitor and (if signed in) user daily quota
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
  v_uid uuid := auth.uid();
  v_vid text := trim(coalesce(p_visitor_id, ''));
begin
  insert into public.ai_conversations (session_id, visitor_id, user_id, message_count, last_message_at)
  values (p_session_id, v_vid, v_uid, 2, now())
  on conflict (session_id) do update set
    message_count = ai_conversations.message_count + 2,
    user_id = coalesce(ai_conversations.user_id, excluded.user_id),
    last_message_at = now()
  returning id into v_conv_id;

  insert into public.ai_messages (conversation_id, role, content)
  values (v_conv_id, 'user', p_user_msg);

  insert into public.ai_messages (conversation_id, role, content, tool_calls)
  values (v_conv_id, 'assistant', p_assistant_msg, p_tool_calls);

  if v_vid <> '' then
    insert into public.ai_daily_quota (day, quota_key, used_count, updated_at)
    values (current_date, 'v:' || v_vid, 1, now())
    on conflict (day, quota_key) do update set
      used_count = ai_daily_quota.used_count + 1,
      updated_at = now();
  end if;

  if v_uid is not null then
    insert into public.ai_daily_quota (day, quota_key, used_count, updated_at)
    values (current_date, 'u:' || v_uid::text, 1, now())
    on conflict (day, quota_key) do update set
      used_count = ai_daily_quota.used_count + 1,
      updated_at = now();
  end if;

  perform public.track_visitor_event(v_vid, 'chat');
end;
$$;

grant all on public.ai_daily_quota to authenticated, service_role;
grant execute on function public.check_ai_chat_quota(text) to anon, authenticated;
grant execute on function public.save_ai_chat_turn(text, text, text, text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
