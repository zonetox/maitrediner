
CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amenities public read" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "amenities admin write" ON public.amenities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.amenities (name, slug, icon, sort_order) VALUES
  ('Bãi đỗ xe','parking','Car',1),
  ('Wi-Fi','wifi','Wifi',2),
  ('Phòng riêng','private-room','DoorOpen',3),
  ('Sân vườn','garden','Trees',4),
  ('View đẹp','view','Mountain',5),
  ('Cho phép thú cưng','pet-friendly','PawPrint',6),
  ('Sống nhạc','live-music','Music',7),
  ('Phù hợp gia đình','family','Users',8);
