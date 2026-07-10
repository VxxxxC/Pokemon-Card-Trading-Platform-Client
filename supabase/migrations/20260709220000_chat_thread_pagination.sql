-- Chat thread pagination — paginated get_chat_room_thread with has_more cursor

CREATE OR REPLACE FUNCTION public.get_chat_room_thread(
  p_room_id UUID,
  p_limit INT DEFAULT 50,
  p_before_created_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_limit INT;
  v_has_more BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'room', NULL,
      'messages', '[]'::jsonb,
      'offers', '[]'::jsonb,
      'has_more', false
    );
  END IF;

  IF NOT public.is_chat_room_member(p_room_id, v_user_id) THEN
    RAISE EXCEPTION '無權限讀取此聊天室';
  END IF;

  v_limit := GREATEST(LEAST(COALESCE(p_limit, 50), 100), 1);

  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT cm.id
      FROM public.chat_messages cm
      WHERE cm.room_id = p_room_id
        AND (
          p_before_created_at IS NULL
          OR cm.created_at < p_before_created_at
        )
      ORDER BY cm.created_at DESC
      OFFSET v_limit
      LIMIT 1
    ) older_rows
  )
  INTO v_has_more;

  RETURN jsonb_build_object(
    'room', (
      SELECT jsonb_build_object(
        'id', cr.id,
        'buyer_id', cr.buyer_id,
        'seller_id', cr.seller_id,
        'created_at', cr.created_at,
        'updated_at', cr.updated_at,
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
      )
      FROM public.chat_rooms cr
      WHERE cr.id = p_room_id
    ),
    'messages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', page_cm.id,
          'room_id', page_cm.room_id,
          'content', page_cm.content,
          'created_at', page_cm.created_at,
          'sender_id', page_cm.sender_id,
          'offer_id', page_cm.offer_id,
          'member_order_id', page_cm.member_order_id,
          'is_system_warning', page_cm.is_system_warning
        )
        ORDER BY page_cm.created_at ASC
      )
      FROM (
        SELECT cm.*
        FROM public.chat_messages cm
        WHERE cm.room_id = p_room_id
          AND (
            p_before_created_at IS NULL
            OR cm.created_at < p_before_created_at
          )
        ORDER BY cm.created_at DESC
        LIMIT v_limit
      ) page_cm
    ), '[]'::jsonb),
    'offers', COALESCE((
      SELECT jsonb_agg(offer_row)
      FROM (
        SELECT DISTINCT ON (o.id)
          jsonb_build_object(
            'id', o.id,
            'buyer_id', o.buyer_id,
            'offer_price', o.offer_price,
            'status', o.status,
            'modified_count', o.modified_count,
            'use_authentication', o.use_authentication,
            'listings', CASE
              WHEN l.id IS NULL THEN NULL
              ELSE jsonb_build_object(
                'product_id', l.product_id,
                'images', l.images,
                'product_catalog', CASE
                  WHEN pc.id IS NULL THEN NULL
                  ELSE jsonb_build_object(
                    'id', pc.id,
                    'name_zh', pc.name_zh,
                    'name_ja', pc.name_ja,
                    'card_number', pc.card_number,
                    'set_code', pc.set_code,
                    'image_url', pc.image_url
                  )
                END
              )
            END
          ) AS offer_row
        FROM (
          SELECT cm.*
          FROM public.chat_messages cm
          WHERE cm.room_id = p_room_id
            AND (
              p_before_created_at IS NULL
              OR cm.created_at < p_before_created_at
            )
          ORDER BY cm.created_at DESC
          LIMIT v_limit
        ) page_cm
        INNER JOIN public.offers o ON o.id = page_cm.offer_id
        LEFT JOIN public.listings l ON l.id = o.listing_id
        LEFT JOIN public.product_catalog pc ON pc.id = l.product_id
        WHERE page_cm.offer_id IS NOT NULL
        ORDER BY o.id, page_cm.created_at ASC
      ) distinct_offers
    ), '[]'::jsonb),
    'has_more', v_has_more
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_chat_room_thread(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_chat_room_thread(UUID, INT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_room_thread(UUID, INT, TIMESTAMPTZ) TO authenticated, service_role;
