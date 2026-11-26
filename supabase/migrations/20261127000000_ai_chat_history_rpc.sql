-- Customer AI chat history RPCs: list conversations, fetch messages, and hide a session
create or replace function public.get_customer_ai_conversations(
  p_visitor_id text,
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_vid text := trim(coalesce(p_visitor_id, ''));
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_rows jsonb := '[]'::jsonb;
begin
  if v_uid is null and v_vid = '' then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(item order by item->>'last_message_at' desc), '[]'::jsonb)
  into v_rows
  from (
    select jsonb_build_object(
      'id', c.id,
      'session_id', c.session_id,
      'message_count', c.message_count,
      'last_message_at', c.last_message_at,
      'created_at', c.created_at,
      'preview', p.content
    ) as item
    from public.ai_conversations c
    left join lateral (
      select m.content
      from public.ai_messages m
      where m.conversation_id = c.id and m.role = 'user'
      order by m.created_at asc
      limit 1
    ) p on true
    where c.cleared_by_user = false
      and c.message_count > 0
      and (
        (v_uid is not null and (c.user_id = v_uid or (c.user_id is null and v_vid <> '' and c.visitor_id = v_vid)))
        or
        (v_uid is null and c.user_id is null and c.visitor_id = v_vid)
      )
    order by c.last_message_at desc
    limit v_limit
  ) sub;

  return v_rows;
end;
$$;

create or replace function public.get_customer_ai_messages(
  p_session_id text,
  p_visitor_id text
)
returns jsonb
language plpgsql
security definer
as $$
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
        'created_at', m.created_at
      )
      order by m.created_at asc
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.ai_messages m
  where m.conversation_id = v_conv_id
    and m.role in ('user', 'assistant');

  return v_rows;
end;
$$;

create or replace function public.hide_customer_ai_conversation(
  p_session_id text,
  p_visitor_id text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_vid text := trim(coalesce(p_visitor_id, ''));
  v_sid text := trim(coalesce(p_session_id, ''));
begin
  if v_sid = '' or (v_uid is null and v_vid = '') then
    return false;
  end if;

  update public.ai_conversations c
  set cleared_by_user = true
  where c.session_id = v_sid
    and (
      (v_uid is not null and (c.user_id = v_uid or (c.user_id is null and v_vid <> '' and c.visitor_id = v_vid)))
      or
      (v_uid is null and c.user_id is null and c.visitor_id = v_vid)
    );

  return found;
end;
$$;

grant execute on function public.get_customer_ai_conversations(text, int) to anon, authenticated;
grant execute on function public.get_customer_ai_messages(text, text) to anon, authenticated;
grant execute on function public.hide_customer_ai_conversation(text, text) to anon, authenticated;
