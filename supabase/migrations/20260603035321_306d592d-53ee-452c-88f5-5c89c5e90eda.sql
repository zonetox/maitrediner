
-- 1) Move pg_net via drop+recreate (SET SCHEMA unsupported)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Unschedule existing cron job that depends on net.http_post (if present)
DO $$
BEGIN
  PERFORM cron.unschedule('expire-memberships-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Reschedule cron using relocated function
SELECT cron.schedule(
  'expire-memberships-daily',
  '0 2 * * *',
  $$SELECT extensions.http_post(
    url := 'https://project--d861710f-f1db-49e6-a212-50fbd6f82f0a.lovable.app/api/public/cron/expire-memberships',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );$$
);

-- 2) Remove bookings & orders from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;

-- 3) Constrain restaurant-owner UPDATE on bookings to safe columns only
CREATE OR REPLACE FUNCTION public.enforce_booking_owner_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF OLD.user_id IS NOT NULL AND OLD.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;
  IF NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.guest_name IS DISTINCT FROM OLD.guest_name
     OR NEW.guest_phone IS DISTINCT FROM OLD.guest_phone
     OR NEW.guest_email IS DISTINCT FROM OLD.guest_email
     OR NEW.party_size IS DISTINCT FROM OLD.party_size
     OR NEW.booking_at IS DISTINCT FROM OLD.booking_at THEN
    RAISE EXCEPTION 'Restaurant owners may only update booking status and notes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_booking_owner_update ON public.bookings;
CREATE TRIGGER trg_enforce_booking_owner_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_booking_owner_update();

-- 4) Explicit SELECT policies on storage.objects for our buckets
DROP POLICY IF EXISTS "Public read restaurant images" ON storage.objects;
CREATE POLICY "Public read restaurant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;
CREATE POLICY "Public read menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');
