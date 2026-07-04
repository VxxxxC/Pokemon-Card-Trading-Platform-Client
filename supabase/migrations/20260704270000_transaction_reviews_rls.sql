-- Transaction reviews: authenticated read (own + public) + participant insert guard

GRANT SELECT, INSERT ON public.transaction_reviews TO authenticated;

ALTER TABLE public.transaction_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transaction_reviews_authenticated_read" ON public.transaction_reviews;
CREATE POLICY "transaction_reviews_authenticated_read"
  ON public.transaction_reviews
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR is_public = true
  );

DROP POLICY IF EXISTS "transaction_reviews_reviewer_insert" ON public.transaction_reviews;
CREATE POLICY "transaction_reviews_reviewer_insert"
  ON public.transaction_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND reviewee_id <> auth.uid()
    AND (
      (
        member_order_id IS NOT NULL
        AND merchant_order_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.member_orders mo
          WHERE mo.id = member_order_id
            AND mo.status = 'completed'
            AND (mo.buyer_id = auth.uid() OR mo.seller_id = auth.uid())
            AND (
              (mo.buyer_id = auth.uid() AND mo.seller_id = reviewee_id)
              OR (mo.seller_id = auth.uid() AND mo.buyer_id = reviewee_id)
            )
        )
      )
      OR
      (
        merchant_order_id IS NOT NULL
        AND member_order_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.merchant_orders mo
          WHERE mo.id = merchant_order_id
            AND mo.escrow_status = 'completed_and_transferred'
            AND (mo.buyer_id = auth.uid() OR mo.merchant_id = auth.uid())
            AND (
              (mo.buyer_id = auth.uid() AND mo.merchant_id = reviewee_id)
              OR (mo.merchant_id = auth.uid() AND mo.buyer_id = reviewee_id)
            )
        )
      )
    )
  );

-- One review per reviewer per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_reviews_reviewer_member_order
  ON public.transaction_reviews (reviewer_id, member_order_id)
  WHERE member_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_reviews_reviewer_merchant_order
  ON public.transaction_reviews (reviewer_id, merchant_order_id)
  WHERE merchant_order_id IS NOT NULL;

-- Refresh reviewee rating_score when a new public review lands
CREATE OR REPLACE FUNCTION public.fn_refresh_profile_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles p
    SET rating_score = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM public.transaction_reviews r
        WHERE r.reviewee_id = p.id
          AND r.is_public = true
    ), 0.0)
    WHERE p.id = NEW.reviewee_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_review_insert_refresh_rating ON public.transaction_reviews;

CREATE TRIGGER tr_on_review_insert_refresh_rating
    AFTER INSERT ON public.transaction_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_refresh_profile_rating_on_review();
