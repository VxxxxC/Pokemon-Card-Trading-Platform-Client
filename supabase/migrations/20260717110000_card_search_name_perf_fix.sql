-- Catalog name search perf: skip flexible id matching for name queries in RPC;
-- avoid full COUNT + snkr_rank pre-sort for identifier autocomplete.

CREATE OR REPLACE FUNCTION public.is_card_identifier_query(p_query text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    length(trim(coalesce(p_query, ''))) > 0
    AND trim(p_query) !~ '[ぁ-んァ-ヶ一-龯]'
    AND trim(p_query) ~ '[a-zA-Z0-9]'
    AND trim(p_query) !~ '^[a-zA-Z]+$'
    AND (
      trim(p_query) ~ '[0-9]'
      OR trim(p_query) ~ '[^a-zA-Z0-9]'
      OR (
        length(public.compact_alphanumeric(p_query)) >= 4
        AND public.compact_alphanumeric(p_query) ~ '[a-z]'
        AND public.compact_alphanumeric(p_query) ~ '[0-9]'
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_card_identifier_query(text)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_product_catalog(
  p_query text,
  p_item_type text DEFAULT 'card'
)
RETURNS TABLE (
  id text,
  name_ja text,
  name_en text,
  name_zh text,
  set_code text,
  card_number text,
  display_id text,
  image_url text,
  type public.catalog_type,
  rarity text,
  pokemon_stage text,
  snkr_rank integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT trim(coalesce(p_query, '')) AS query
  ),
  filtered AS (
    SELECT
      pc.id,
      pc.name_ja,
      pc.name_en,
      pc.name_zh,
      pc.set_code,
      pc.card_number,
      pc.display_id,
      pc.image_url,
      pc.type,
      pc.rarity,
      pc.pokemon_stage,
      pc.snkr_rank
    FROM public.product_catalog pc
    CROSS JOIN params p
    WHERE length(p.query) >= 2
      AND (
        (
          p_item_type = 'box_set'
          AND pc.type IN (
            'booster_box',
            'gift_set',
            'booster_pack',
            'starter_deck'
          )
        )
        OR (
          p_item_type <> 'box_set'
          AND pc.type = 'single_card'
        )
      )
      AND (
        pc.name_ja ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.name_en ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.name_zh ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.set_code ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR (
          public.is_card_identifier_query(p.query)
          AND public.catalog_card_identifier_matches(
            p.query,
            pc.set_code,
            pc.card_number,
            pc.display_id
          )
        )
      )
  ),
  limited AS (
    SELECT * FROM filtered
    LIMIT 51
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count FROM limited
  )
  SELECT
    l.id,
    l.name_ja,
    l.name_en,
    l.name_zh,
    l.set_code,
    l.card_number,
    l.display_id,
    l.image_url,
    l.type,
    l.rarity,
    l.pokemon_stage,
    l.snkr_rank,
    c.total_count
  FROM limited l
  CROSS JOIN counted c;
$$;

GRANT EXECUTE ON FUNCTION public.search_product_catalog(text, text)
  TO anon, authenticated, service_role;
