-- Assign a random unique username when a new auth user creates a profile row

CREATE OR REPLACE FUNCTION public.generate_profile_username()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  attempt integer := 0;
BEGIN
  LOOP
    candidate := 'user_' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE lower(username) = lower(candidate)
    );

    attempt := attempt + 1;
    IF attempt >= 12 THEN
      candidate := 'user_' || lower(replace(gen_random_uuid()::text, '-', ''));
      EXIT;
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role;
BEGIN
  BEGIN
    requested_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'member'::public.user_role
    );
  EXCEPTION
    WHEN invalid_text_representation THEN
      requested_role := 'member'::public.user_role;
  END;

  INSERT INTO public.profiles (id, display_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    public.generate_profile_username(),
    requested_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    updated_at = now();

  RETURN NEW;
END;
$$;
