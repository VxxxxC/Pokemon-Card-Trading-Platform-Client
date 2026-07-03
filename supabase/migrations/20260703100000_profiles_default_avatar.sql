-- Default profile avatar for new members and merchants (public asset)

ALTER TABLE public.profiles
  ALTER COLUMN avatar_path SET DEFAULT '/asset/default-avator.webp';
