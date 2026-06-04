ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;