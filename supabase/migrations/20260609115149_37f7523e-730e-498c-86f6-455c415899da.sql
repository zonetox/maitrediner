
DROP POLICY IF EXISTS "payment_settings public read" ON public.payment_settings;
CREATE POLICY "payment_settings authenticated read"
  ON public.payment_settings
  FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'favorites'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.favorites';
  END IF;
END $$;
