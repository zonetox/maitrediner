-- Drop unused app_settings table
DROP TABLE IF EXISTS public.app_settings;

-- Restrict storage object listing to owner folder + admin for the public buckets.
-- Public read via CDN remains unaffected (object URLs are still publicly servable).
CREATE POLICY "Restaurant images: owner or admin can list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'restaurant-images'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Menu images: owner or admin can list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );