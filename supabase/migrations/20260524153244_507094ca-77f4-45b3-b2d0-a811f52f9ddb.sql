-- Tighten INSERT policies with basic field-presence checks (replaces WITH CHECK true)
DROP POLICY IF EXISTS "bookings insert anyone" ON public.bookings;
CREATE POLICY "bookings insert anyone" ON public.bookings
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND length(btrim(guest_name)) BETWEEN 1 AND 120
  AND length(btrim(guest_phone)) BETWEEN 6 AND 30
  AND party_size BETWEEN 1 AND 50
  AND booking_at > now() - interval '1 day'
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "orders insert anyone" ON public.orders;
CREATE POLICY "orders insert anyone" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  restaurant_id IS NOT NULL
  AND length(btrim(coalesce(guest_name,''))) BETWEEN 1 AND 120
  AND length(btrim(coalesce(guest_phone,''))) BETWEEN 6 AND 30
  AND total_amount >= 0
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "newsletter insert anyone" ON public.newsletter_subscribers;
CREATE POLICY "newsletter insert anyone" ON public.newsletter_subscribers
FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 254
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);