-- Fix chat inbox permission denied: explicit grants + SECURITY DEFINER inbox RPC

REVOKE ALL ON public.chat_rooms FROM PUBLIC;
REVOKE ALL ON public.chat_messages FROM PUBLIC;
REVOKE ALL ON public.offers FROM PUBLIC;

GRANT SELECT ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT SELECT ON public.offers TO authenticated;

GRANT SELECT ON public.chat_rooms TO service_role;
GRANT SELECT, INSERT ON public.chat_messages TO service_role;
GRANT SELECT ON public.offers TO service_role;

-- Belt-and-suspenders: split SELECT policies (some projects reject FOR ALL)
DROP POLICY IF EXISTS "chat_rooms_party_access" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_party_select" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_party_insert" ON public.chat_rooms;

CREATE POLICY "chat_rooms_party_select"
  ON public.chat_rooms
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "chat_rooms_party_insert"
  ON public.chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_user_chat_inbox()
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
      'messages', '[]'::jsonb,
      'offers', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'rooms', COALESCE((
      SELECT jsonb_agg(room_row)
      FROM (
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
        ) AS room_row
        FROM public.chat_rooms cr
        WHERE cr.buyer_id = v_user_id OR cr.seller_id = v_user_id
        ORDER BY COALESCE(cr.updated_at, cr.created_at) DESC
      ) ordered_rooms
    ), '[]'::jsonb),
    'messages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cm.id,
          'room_id', cm.room_id,
          'content', cm.content,
          'created_at', cm.created_at,
          'sender_id', cm.sender_id,
          'offer_id', cm.offer_id,
          'is_system_warning', cm.is_system_warning
        )
        ORDER BY cm.created_at ASC
      )
      FROM public.chat_messages cm
      INNER JOIN public.chat_rooms cr ON cr.id = cm.room_id
      WHERE cr.buyer_id = v_user_id OR cr.seller_id = v_user_id
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
        FROM public.offers o
        INNER JOIN public.chat_rooms cr ON cr.id = o.room_id
        LEFT JOIN public.listings l ON l.id = o.listing_id
        LEFT JOIN public.product_catalog pc ON pc.id = l.product_id
        WHERE cr.buyer_id = v_user_id OR cr.seller_id = v_user_id
        ORDER BY o.id
      ) deduped_offers
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_chat_inbox() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_chat_inbox() TO authenticated, service_role;
