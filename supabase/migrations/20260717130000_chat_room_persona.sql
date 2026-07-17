-- Dual persona chat rooms: member vs merchant are separate room identities per party.

ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS buyer_persona public.seller_persona_type
    NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS seller_persona public.seller_persona_type
    NOT NULL DEFAULT 'member';

-- Backfill seller_persona from the latest offer listing in each room.
UPDATE public.chat_rooms cr
SET seller_persona = COALESCE(latest.seller_persona, 'member')
FROM (
  SELECT DISTINCT ON (o.room_id)
    o.room_id,
    l.seller_persona
  FROM public.offers o
  INNER JOIN public.listings l ON l.id = o.listing_id
  ORDER BY o.room_id, o.updated_at DESC NULLS LAST, o.created_at DESC
) AS latest
WHERE cr.id = latest.room_id;

-- Consolidate duplicate rooms that share the same persona tuple after backfill.
WITH ranked AS (
  SELECT
    id,
    buyer_id,
    buyer_persona,
    seller_id,
    seller_persona,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, buyer_persona, seller_id, seller_persona
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM public.chat_rooms
),
canonical AS (
  SELECT buyer_id, buyer_persona, seller_id, seller_persona, id AS canonical_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS duplicate_id, c.canonical_id
  FROM ranked r
  INNER JOIN canonical c
    ON c.buyer_id = r.buyer_id
   AND c.buyer_persona = r.buyer_persona
   AND c.seller_id = r.seller_id
   AND c.seller_persona = r.seller_persona
  WHERE r.rn > 1
)
UPDATE public.chat_messages cm
SET room_id = d.canonical_id
FROM dupes d
WHERE cm.room_id = d.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    buyer_id,
    buyer_persona,
    seller_id,
    seller_persona,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, buyer_persona, seller_id, seller_persona
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM public.chat_rooms
),
canonical AS (
  SELECT buyer_id, buyer_persona, seller_id, seller_persona, id AS canonical_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS duplicate_id, c.canonical_id
  FROM ranked r
  INNER JOIN canonical c
    ON c.buyer_id = r.buyer_id
   AND c.buyer_persona = r.buyer_persona
   AND c.seller_id = r.seller_id
   AND c.seller_persona = r.seller_persona
  WHERE r.rn > 1
)
UPDATE public.offers o
SET room_id = d.canonical_id
FROM dupes d
WHERE o.room_id = d.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, buyer_persona, seller_id, seller_persona
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM public.chat_rooms
)
DELETE FROM public.chat_rooms cr
USING ranked r
WHERE cr.id = r.id
  AND r.rn > 1;

DROP INDEX IF EXISTS public.chat_rooms_buyer_seller_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_parties_persona_unique_idx
  ON public.chat_rooms (buyer_id, buyer_persona, seller_id, seller_persona);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_party_persona_updated_at
  ON public.chat_rooms (buyer_id, buyer_persona, seller_id, seller_persona, updated_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION public.fn_chat_party_profile_snippet(
  p_profile_id UUID,
  p_persona public.seller_persona_type
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'persona', p_persona,
    'display_name', p.display_name,
    'username', p.username,
    'role', p.role,
    'avatar_path', p.avatar_path,
    'shop_name', ms.shop_name,
    'shop_handle', ms.shop_handle,
    'is_merchant', (p_persona = 'merchant')
  )
  FROM public.profiles p
  LEFT JOIN public.merchant_shops ms ON ms.merchant_id = p.id
  WHERE p.id = p_profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.fn_chat_party_profile_snippet(UUID, public.seller_persona_type)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rpc_make_offer(
    p_listing_id UUID,
    p_buyer_id UUID,
    p_offer_price NUMERIC,
    p_content TEXT,
    p_use_authentication BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_seller_id UUID;
    v_seller_persona public.seller_persona_type;
    v_listing_status TEXT;
    v_listing_accepts_auth BOOLEAN;
    v_room_id UUID;
    v_offer_id UUID;
    v_message_id UUID;
    v_message_content TEXT;
    v_room_row RECORD;
    v_offer_row RECORD;
    v_message_row RECORD;
BEGIN
    SELECT
        l.seller_id,
        l.seller_persona,
        l.status,
        l.use_authentication
    INTO
        v_seller_id,
        v_seller_persona,
        v_listing_status,
        v_listing_accepts_auth
    FROM public.listings l
    WHERE l.id = p_listing_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到該卡牌商品。';
    END IF;

    IF v_listing_status <> 'active' THEN
        RAISE EXCEPTION '商品非 active 狀態，無法出價。';
    END IF;

    IF v_seller_id = p_buyer_id THEN
        RAISE EXCEPTION '您無法對自己的商品出價。';
    END IF;

    IF COALESCE(p_use_authentication, false) AND NOT COALESCE(v_listing_accepts_auth, false) THEN
        RAISE EXCEPTION '此賣家不接受平台鑑定加購服務，請關閉鑑定選項後再出價。';
    END IF;

    PERFORM public.fn_assert_p2p_offer_aml_limits(
        p_buyer_id,
        p_offer_price,
        p_listing_id,
        COALESCE(p_use_authentication, false)
    );

    v_message_content := p_content;
    IF COALESCE(p_use_authentication, false) THEN
        v_message_content := '[AUTH_REQUEST] ' || v_message_content;
    END IF;

    INSERT INTO public.chat_rooms (
      buyer_id,
      buyer_persona,
      seller_id,
      seller_persona,
      updated_at
    )
    VALUES (
      p_buyer_id,
      'member',
      v_seller_id,
      COALESCE(v_seller_persona, 'member'),
      now()
    )
    ON CONFLICT (buyer_id, buyer_persona, seller_id, seller_persona) DO UPDATE
      SET updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_room_id;

    INSERT INTO public.offers (
        room_id,
        buyer_id,
        listing_id,
        offer_price,
        status,
        use_authentication
    )
    VALUES (
        v_room_id,
        p_buyer_id,
        p_listing_id,
        p_offer_price,
        'pending',
        COALESCE(p_use_authentication, false)
    )
    RETURNING id INTO v_offer_id;

    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_buyer_id, v_message_content, v_offer_id, false)
    RETURNING id INTO v_message_id;

    SELECT * INTO v_room_row FROM public.chat_rooms WHERE id = v_room_id;
    SELECT * INTO v_offer_row FROM public.offers WHERE id = v_offer_id;
    SELECT * INTO v_message_row FROM public.chat_messages WHERE id = v_message_id;

    RETURN jsonb_build_object(
        'room', to_jsonb(v_room_row),
        'offer', to_jsonb(v_offer_row),
        'message', to_jsonb(v_message_row)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN) TO authenticated, service_role;

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
            'buyer_persona', cr.buyer_persona,
            'seller_id', cr.seller_id,
            'seller_persona', cr.seller_persona,
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
            'buyer', public.fn_chat_party_profile_snippet(cr.buyer_id, cr.buyer_persona),
            'seller', public.fn_chat_party_profile_snippet(cr.seller_id, cr.seller_persona)
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
        'buyer_persona', cr.buyer_persona,
        'seller_id', cr.seller_id,
        'seller_persona', cr.seller_persona,
        'created_at', cr.created_at,
        'updated_at', cr.updated_at,
        'buyer', public.fn_chat_party_profile_snippet(cr.buyer_id, cr.buyer_persona),
        'seller', public.fn_chat_party_profile_snippet(cr.seller_id, cr.seller_persona)
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

REVOKE ALL ON FUNCTION public.get_chat_room_thread(UUID, INT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_room_thread(UUID, INT, TIMESTAMPTZ) TO authenticated, service_role;
