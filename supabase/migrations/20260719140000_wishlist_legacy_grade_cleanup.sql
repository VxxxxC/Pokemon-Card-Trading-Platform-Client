-- Normalize legacy wishlist rows written with display labels or empty OTHER scores

UPDATE public.product_watchlists
SET
  grading_company = 'OTHER',
  grading_score = 'SEALED'
WHERE trim(grading_company) = '密封'
   OR upper(trim(grading_company)) = 'SEALED'
   OR (
     upper(trim(grading_company)) = 'OTHER'
     AND coalesce(nullif(trim(grading_score), ''), '') = ''
   );

UPDATE public.product_watchlists
SET
  grading_company = 'OTHER',
  grading_score = 'UNSEALED'
WHERE trim(grading_company) = '已開封';
