-- Strengthen read cursor: optional p_read_at + MAX(room messages); exclude SYSTEM_% from unread.

DROP FUNCTION IF EXISTS public.rpc_mark_chat_room_read(UUID);

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
  v_latest_message_at TIMESTAMPTZ;
  v_cursor TIMESTAMPTZ;
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

  SELECT MAX(cm.created_at)
  INTO v_latest_message_at
  FROM public.chat_messages cm
  WHERE cm.room_id = p_room_id;

  v_cursor := GREATEST(
    COALESCE(p_read_at, now()),
    COALESCE(v_latest_message_at, COALESCE(p_read_at, now()))
  );

  INSERT INTO public.chat_room_reads (user_id, room_id, last_read_at)
  VALUES (v_user_id, p_room_id, v_cursor)
  ON CONFLICT (user_id, room_id)
  DO UPDATE SET last_read_at = GREATEST(
    public.chat_room_reads.last_read_at,
    EXCLUDED.last_read_at
  );

  RETURN jsonb_build_object('success', true, 'last_read_at', v_cursor);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_mark_chat_room_read(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_mark_chat_room_read(UUID, TIMESTAMPTZ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_user_chat_inbox_lobby()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'rooms', '[]'::jsonb,
      'last_messages', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'rooms', COALESCE((
      SELECT jsonb_agg(room_row ORDER BY sort_ts DESC)
      FROM (
        SELECT
          jsonb_build_object(
            'id', cr.id,
            'buyer_id', cr.buyer_id,
            'seller_id', cr.seller_id,
            'created_at', cr.created_at,
            'updated_at', cr.updated_at,
            'unread_count', COALESCE((
              SELECT COUNT(*)::int
              FROM public.chat_messages cm
              WHERE cm.room_id = cr.id
                AND cm.sender_id <> v_user_id
                AND NOT (cm.content LIKE 'SYSTEM\_%' ESCAPE '\')
                AND cm.created_at > COALESCE(
                  (
                    SELECT crr.last_read_at
                    FROM public.chat_room_reads crr
                    WHERE crr.user_id = v_user_id
                      AND crr.room_id = cr.id
                  ),
                  '-infinity'::timestamptz
                )
            ), 0),
            'buyer', (
              SELECT jsonb_build_object(
                'id', bp.id,
                'display_name', bp.display_name,
                'role', bp.role
              )
              FROM public.profiles bp
              WHERE bp.id = cr.buyer_id
            ),
            'seller', (
              SELECT jsonb_build_object(
                'id', sp.id,
                'display_name', sp.display_name,
                'role', sp.role
              )
              FROM public.profiles sp
              WHERE sp.id = cr.seller_id
            )
          ) AS room_row,
          COALESCE(cr.updated_at, cr.created_at) AS sort_ts
        FROM public.chat_rooms cr
        WHERE cr.buyer_id = v_user_id OR cr.seller_id = v_user_id
      ) ordered_rooms
    ), '[]'::jsonb),
    'last_messages', COALESCE((
      SELECT jsonb_agg(last_row)
      FROM (
        SELECT DISTINCT ON (cm.room_id)
          jsonb_build_object(
            'id', cm.id,
            'room_id', cm.room_id,
            'content', cm.content,
            'created_at', cm.created_at,
            'sender_id', cm.sender_id,
            'offer_id', cm.offer_id,
            'member_order_id', cm.member_order_id,
            'is_system_warning', cm.is_system_warning
          ) AS last_row
        FROM public.chat_messages cm
        INNER JOIN public.chat_rooms cr ON cr.id = cm.room_id
        WHERE cr.buyer_id = v_user_id OR cr.seller_id = v_user_id
        ORDER BY cm.room_id, cm.created_at DESC
      ) distinct_last
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_chat_inbox_lobby() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_chat_inbox_lobby() TO authenticated, service_role;
