-- AML: flag chat messages soliciting offline payment (私下 + 過數).
-- Forward-fix for DBs that already applied 20260704210500.

CREATE OR REPLACE FUNCTION public.rpc_send_chat_message(
  p_room_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed_content TEXT;
  v_message_id UUID;
  v_message_row RECORD;
  v_is_system_warning BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
    RAISE EXCEPTION '保安攔截：請先登入後再發送訊息。';
  END IF;

  v_trimmed_content := trim(p_content);

  IF v_trimmed_content IS NULL OR v_trimmed_content = '' THEN
    RAISE EXCEPTION '訊息不能為空。';
  END IF;

  IF char_length(v_trimmed_content) > 2000 THEN
    RAISE EXCEPTION '訊息長度不可超過 2000 字。';
  END IF;

  IF NOT public.is_chat_room_member(p_room_id, p_sender_id) THEN
    RAISE EXCEPTION '操作失敗：您不是此聊天室的成員。';
  END IF;

  v_is_system_warning :=
    v_trimmed_content LIKE '%私下%'
    AND v_trimmed_content LIKE '%過數%';

  INSERT INTO public.chat_messages (room_id, sender_id, content, is_system_warning)
  VALUES (p_room_id, p_sender_id, v_trimmed_content, v_is_system_warning)
  RETURNING id INTO v_message_id;

  SELECT id, room_id, content, created_at, is_system_warning
  INTO v_message_row
  FROM public.chat_messages
  WHERE id = v_message_id;

  RETURN jsonb_build_object(
    'id', v_message_row.id,
    'room_id', v_message_row.room_id,
    'content', v_message_row.content,
    'created_at', v_message_row.created_at,
    'is_system_warning', v_message_row.is_system_warning
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_send_chat_message(UUID, UUID, TEXT) TO authenticated, service_role;
