-- Gate AI chatbot to 5 free guest messages before requiring customer sign-in
-- Signed-in customers keep the full daily limit (default: 20 messages/day)

create or replace function public.check_ai_chat_quota(p_visitor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_is_authenticated boolean := v_uid is not null;
  v_limit int := 20;
  v_guest_limit int := 5;
  v_user_used int := 0;
  v_visitor_used int := 0;
  v_used int := 0;
  v_effective_limit int := 5;
begin
  select coalesce(daily_chat_limit, 20)
  into v_limit
  from public.ai_bot_settings
  where id = 'default';

  v_limit := greatest(1, coalesce(v_limit, 20));
  v_guest_limit := least(5, v_limit);

  if v_is_authenticated then
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
  v_effective_limit := case when v_is_authenticated then v_limit else v_guest_limit end;

  return jsonb_build_object(
    'daily_limit', v_limit,
    'guest_limit', v_guest_limit,
    'used_today', v_used,
    'remaining', greatest(0, v_effective_limit - v_used),
    'allowed', v_used < v_effective_limit,
    'is_authenticated', v_is_authenticated,
    'require_auth', (not v_is_authenticated) and (v_used >= v_guest_limit)
  );
end;
$$;
