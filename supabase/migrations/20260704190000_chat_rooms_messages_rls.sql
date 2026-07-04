-- Chat inbox: party-scoped read/write for authenticated users

GRANT SELECT ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT SELECT ON public.offers TO authenticated;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_party_access" ON public.chat_rooms;
CREATE POLICY "chat_rooms_party_access"
  ON public.chat_rooms
  FOR ALL
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "chat_messages_party_read" ON public.chat_messages;
CREATE POLICY "chat_messages_party_read"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_rooms r
      WHERE r.id = chat_messages.room_id
        AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_messages_party_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_party_insert"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.chat_rooms r
      WHERE r.id = chat_messages.room_id
        AND (r.buyer_id = auth.uid() OR r.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "offers_party_read" ON public.offers;
CREATE POLICY "offers_party_read"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.chat_rooms r
      WHERE r.id = offers.room_id
        AND r.seller_id = auth.uid()
    )
  );
