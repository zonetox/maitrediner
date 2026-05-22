ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS dress_code TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS deposit_policy TEXT,
  ADD COLUMN IF NOT EXISTS price_per_guest_min NUMERIC,
  ADD COLUMN IF NOT EXISTS price_per_guest_max NUMERIC;