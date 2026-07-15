-- Mark read across all rooms shared with the same counterpart (duplicate buyer/seller orientation).

CREATE OR REPLACE FUNCTION public.rpc_mark_chat_room_read(
  p_room_id UUID,
  p_read_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_counterpart_id UUID;
  v_target_room_id UUID;
  v_latest_message_at TIMESTAMPTZ;
  v_cursor TIMESTAMPTZ;
  v_last_read_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '請先登入後再操作';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    WHERE cr.id = p_room_id
      AND (cr.buyer_id = v_user_id OR cr.seller_id = v_user_id)
  ) THEN
    RAISE EXCEPTION '無權標記此聊天室為已讀';
  END IF;

  SELECT CASE
    WHEN cr.buyer_id = v_user_id THEN cr.seller_id
    ELSE cr.buyer_id
  END
  INTO v_counterpart_id
  FROM public.chat_rooms cr
  WHERE cr.id = p_room_id;

  v_last_read_at := COALESCE(p_read_at, now());

  FOR v_target_room_id IN
    SELECT cr.id
    FROM public.chat_rooms cr
    WHERE (
      cr.buyer_id = v_user_id
      AND cr.seller_id = v_counterpart_id
    ) OR (
      cr.seller_id = v_user_id
      AND cr.buyer_id = v_counterpart_id
    )
  LOOP
    SELECT MAX(cm.created_at)
    INTO v_latest_message_at
    FROM public.chat_messages cm
    WHERE cm.room_id = v_target_room_id;

    v_cursor := GREATEST(
      v_last_read_at,
      COALESCE(v_latest_message_at, v_last_read_at)
    );

    INSERT INTO public.chat_room_reads (user_id, room_id, last_read_at)
    VALUES (v_user_id, v_target_room_id, v_cursor)
    ON CONFLICT (user_id, room_id)
    DO UPDATE SET last_read_at = GREATEST(
      public.chat_room_reads.last_read_at,
      EXCLUDED.last_read_at
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'last_read_at', v_last_read_at,
    'counterpart_id', v_counterpart_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_mark_chat_room_read(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_mark_chat_room_read(UUID, TIMESTAMPTZ) TO authenticated, service_role;
