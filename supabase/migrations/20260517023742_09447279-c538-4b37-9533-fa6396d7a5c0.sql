
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public read restaurant images" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-images');
CREATE POLICY "Public read menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

-- Authenticated users can upload to their own folder (first path segment = user id)
CREATE POLICY "Users upload restaurant images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users update restaurant images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete restaurant images" ON storage.objects FOR DELETE USING (
  bucket_id = 'restaurant-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users upload menu images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users update menu images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete menu images" ON storage.objects FOR DELETE USING (
  bucket_id = 'menu-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Menu items: multiple images
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
