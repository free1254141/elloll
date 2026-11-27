-- Persist rich chat visuals, product cards, suggested buttons, and latency in ai_messages.metadata
ALTER TABLE public.ai_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Drop old 5-argument overload so PostgREST resolves save_ai_chat_turn unambiguously
DROP FUNCTION IF EXISTS public.save_ai_chat_turn(text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.save_ai_chat_turn(
  p_session_id text,
  p_visitor_id text,
  p_user_msg text,
  p_assistant_msg text,
  p_tool_calls jsonb DEFAULT NULL::jsonb,
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_conv_id uuid;
  v_uid uuid := auth.uid();
  v_vid text := trim(coalesce(p_visitor_id, ''));
  v_now timestamptz := now();
begin
  insert into public.ai_conversations (session_id, visitor_id, user_id, message_count, last_message_at)
  values (p_session_id, v_vid, v_uid, 2, v_now)
  on conflict (session_id) do update set
    message_count = ai_conversations.message_count + 2,
    user_id = coalesce(ai_conversations.user_id, excluded.user_id),
    last_message_at = v_now
  returning id into v_conv_id;

  insert into public.ai_messages (conversation_id, role, content, created_at)
  values (v_conv_id, 'user', p_user_msg, v_now - interval '1 millisecond');

  insert into public.ai_messages (conversation_id, role, content, tool_calls, metadata, created_at)
  values (v_conv_id, 'assistant', p_assistant_msg, p_tool_calls, p_metadata, v_now);

  if v_vid <> '' then
    insert into public.ai_daily_quota (day, quota_key, used_count, updated_at)
    values (current_date, 'v:' || v_vid, 1, v_now)
    on conflict (day, quota_key) do update set
      used_count = ai_daily_quota.used_count + 1,
      updated_at = v_now;
  end if;

  if v_uid is not null then
    insert into public.ai_daily_quota (day, quota_key, used_count, updated_at)
    values (current_date, 'u:' || v_uid::text, 1, v_now)
    on conflict (day, quota_key) do update set
      used_count = ai_daily_quota.used_count + 1,
      updated_at = v_now;
  end if;

  perform public.track_visitor_event(v_vid, 'chat');
end;
$function$;

GRANT EXECUTE ON FUNCTION public.save_ai_chat_turn(text, text, text, text, jsonb, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_customer_ai_messages(
  p_session_id text,
  p_visitor_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  v_uid uuid := auth.uid();
  v_vid text := trim(coalesce(p_visitor_id, ''));
  v_sid text := trim(coalesce(p_session_id, ''));
  v_conv_id uuid;
  v_rows jsonb := '[]'::jsonb;
begin
  if v_sid = '' or (v_uid is null and v_vid = '') then
    return '[]'::jsonb;
  end if;

  select c.id
  into v_conv_id
  from public.ai_conversations c
  where c.session_id = v_sid
    and c.cleared_by_user = false
    and (
      (v_uid is not null and (c.user_id = v_uid or (c.user_id is null and v_vid <> '' and c.visitor_id = v_vid)))
      or
      (v_uid is null and c.user_id is null and c.visitor_id = v_vid)
    )
  limit 1;

  if v_conv_id is null then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'role', m.role,
        'content', m.content,
        'tool_calls', m.tool_calls,
        'metadata', m.metadata,
        'created_at', m.created_at
      )
      order by m.created_at asc, case when m.role = 'user' then 0 else 1 end asc
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.ai_messages m
  where m.conversation_id = v_conv_id
    and m.role in ('user', 'assistant');

  return v_rows;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.get_customer_ai_messages(text, text) TO anon, authenticated;
