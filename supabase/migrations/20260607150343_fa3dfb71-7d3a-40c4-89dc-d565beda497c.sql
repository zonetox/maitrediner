
DROP POLICY IF EXISTS "Users upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users update restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete menu images" ON storage.objects;

CREATE POLICY "Owners upload restaurant images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);

CREATE POLICY "Owners update restaurant images" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);

CREATE POLICY "Owners delete restaurant images" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);

CREATE POLICY "Owners upload menu images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);

CREATE POLICY "Owners update menu images" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);

CREATE POLICY "Owners delete menu images" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.owner_id = auth.uid())
  )
);
