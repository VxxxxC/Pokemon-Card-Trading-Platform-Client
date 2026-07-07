-- Phase 2: chat inbox performance — dedupe rooms, indexes, lobby/thread RPC split

-- ---------------------------------------------------------------------------
-- 1. Consolidate legacy duplicate chat_rooms (same buyer_id + seller_id)
-- ---------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    buyer_id,
    seller_id,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, seller_id
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM public.chat_rooms
),
canonical AS (
  SELECT buyer_id, seller_id, id AS canonical_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS duplicate_id, c.canonical_id
  FROM ranked r
  INNER JOIN canonical c
    ON c.buyer_id = r.buyer_id
   AND c.seller_id = r.seller_id
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
    seller_id,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, seller_id
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
               created_at DESC NULLS LAST,
               id DESC
    ) AS rn
  FROM public.chat_rooms
),
canonical AS (
  SELECT buyer_id, seller_id, id AS canonical_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS duplicate_id, c.canonical_id
  FROM ranked r
  INNER JOIN canonical c
    ON c.buyer_id = r.buyer_id
   AND c.seller_id = r.seller_id
  WHERE r.rn > 1
)
UPDATE public.offers o
SET room_id = d.canonical_id
FROM dupes d
WHERE o.room_id = d.duplicate_id;

WITH ranked AS (
  SELECT
    id,
    buyer_id,
    seller_id,
    ROW_NUMBER() OVER (
      PARTITION BY buyer_id, seller_id
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

-- ---------------------------------------------------------------------------
-- 2. Indexes + uniqueness guard for user-centric rooms
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_buyer_seller_unique_idx
  ON public.chat_rooms (buyer_id, seller_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_created_at
  ON public.chat_messages (room_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_party_updated_at
  ON public.chat_rooms (buyer_id, seller_id, updated_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- 3. Lobby RPC — rooms + last message preview only (no full thread history)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. Thread RPC — full messages + offer snippets for one room
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_chat_room_thread(p_room_id UUID)
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
      'room', NULL,
      'messages', '[]'::jsonb,
      'offers', '[]'::jsonb
    );
  END IF;

  IF NOT public.is_chat_room_member(p_room_id, v_user_id) THEN
    RAISE EXCEPTION '無權限讀取此聊天室';
  END IF;

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
          'id', cm.id,
          'room_id', cm.room_id,
          'content', cm.content,
          'created_at', cm.created_at,
          'sender_id', cm.sender_id,
          'offer_id', cm.offer_id,
          'member_order_id', cm.member_order_id,
          'is_system_warning', cm.is_system_warning
        )
        ORDER BY cm.created_at ASC
      )
      FROM public.chat_messages cm
      WHERE cm.room_id = p_room_id
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
        FROM public.chat_messages cm
        INNER JOIN public.offers o ON o.id = cm.offer_id
        LEFT JOIN public.listings l ON l.id = o.listing_id
        LEFT JOIN public.product_catalog pc ON pc.id = l.product_id
        WHERE cm.room_id = p_room_id
          AND cm.offer_id IS NOT NULL
        ORDER BY o.id, cm.created_at ASC
      ) distinct_offers
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_chat_room_thread(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_room_thread(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. rpc_make_offer — race-safe room upsert via unique (buyer_id, seller_id)
-- ---------------------------------------------------------------------------
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
    v_listing_status TEXT;
    v_room_id UUID;
    v_offer_id UUID;
    v_message_id UUID;
    v_room_row RECORD;
    v_offer_row RECORD;
    v_message_row RECORD;
BEGIN
    SELECT seller_id, status INTO v_seller_id, v_listing_status FROM public.listings WHERE id = p_listing_id;
    IF NOT FOUND THEN RAISE EXCEPTION '找不到該卡牌商品。'; END IF;
    IF v_listing_status <> 'active' THEN RAISE EXCEPTION '商品非 active 狀態，無法出價。'; END IF;
    IF v_seller_id = p_buyer_id THEN RAISE EXCEPTION '您無法對自己的商品出價。'; END IF;

    INSERT INTO public.chat_rooms (buyer_id, seller_id, updated_at)
    VALUES (p_buyer_id, v_seller_id, now())
    ON CONFLICT (buyer_id, seller_id) DO UPDATE
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
    VALUES (v_room_id, p_buyer_id, p_content, v_offer_id, false)
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
