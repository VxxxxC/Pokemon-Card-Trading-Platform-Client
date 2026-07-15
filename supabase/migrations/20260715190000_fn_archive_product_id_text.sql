-- fn_archive_seller_collection_for_listing: product_catalog.id / listings.product_id are TEXT
-- (e.g. OFFICIAL-35681), not UUID. Casting to UUID caused rpc_complete_member_order to fail.

CREATE OR REPLACE FUNCTION public.fn_archive_seller_collection_for_listing(
  p_listing_id UUID,
  p_seller_id UUID,
  p_final_price NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id TEXT;
  v_grading_company TEXT;
  v_grading_score TEXT;
  v_source_collection_text TEXT;
  v_source_collection_id UUID;
  v_target_id UUID;
BEGIN
  SELECT
    l.product_id::text,
    l.grading_company,
    l.grading_score,
    l.source_collection_id::text
  INTO
    v_product_id,
    v_grading_company,
    v_grading_score,
    v_source_collection_text
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_source_collection_id := NULL;
  IF v_source_collection_text IS NOT NULL AND btrim(v_source_collection_text) <> '' THEN
    BEGIN
      v_source_collection_id := btrim(v_source_collection_text)::uuid;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_source_collection_id := NULL;
    END;
  END IF;

  IF v_source_collection_id IS NOT NULL THEN
    SELECT uc.id
    INTO v_target_id
    FROM public.user_collections uc
    WHERE uc.id = v_source_collection_id
      AND uc.user_id = p_seller_id
      AND uc.sold_at IS NULL;

    IF FOUND THEN
      UPDATE public.user_collections
      SET
        sold_at = now(),
        sold_listing_id = p_listing_id,
        sold_price = p_final_price,
        updated_at = now()
      WHERE id = v_target_id;
      RETURN;
    END IF;
  END IF;

  SELECT uc.id
  INTO v_target_id
  FROM public.user_collections uc
  WHERE uc.user_id = p_seller_id
    AND uc.product_id = v_product_id
    AND uc.grading_company = v_grading_company
    AND uc.grading_score = COALESCE(v_grading_score, '')
    AND uc.sold_at IS NULL
  ORDER BY uc.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.user_collections
  SET
    sold_at = now(),
    sold_listing_id = p_listing_id,
    sold_price = p_final_price,
    updated_at = now()
  WHERE id = v_target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_archive_seller_collection_for_listing(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_archive_seller_collection_for_listing(UUID, UUID, NUMERIC) TO service_role;
