-- Auth registration support: profile grants, uniqueness, and signup trigger

GRANT SELECT, INSERT, UPDATE ON public.profiles TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_idx
  ON public.profiles (lower(display_name));

CREATE OR REPLACE FUNCTION public.is_display_name_available(name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(display_name) = lower(trim(name))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_display_name_available(text)
  TO anon, authenticated, service_role;

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

  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    requested_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
