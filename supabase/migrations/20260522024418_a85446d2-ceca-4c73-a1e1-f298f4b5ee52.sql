
-- Cuisine categories (admin-managed)
CREATE TABLE public.cuisine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cuisine_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cuisine public read" ON public.cuisine_categories FOR SELECT USING (true);
CREATE POLICY "cuisine admin write" ON public.cuisine_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Locations (admin-managed)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "locations admin write" ON public.locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Amenities on restaurants (free text + suggestions)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';

-- Seed common cuisines
INSERT INTO public.cuisine_categories (name, slug, icon, sort_order) VALUES
  ('Fine dining', 'fine-dining', 'Utensils', 1),
  ('Omakase', 'omakase', 'Fish', 2),
  ('Steakhouse', 'steakhouse', 'Beef', 3),
  ('Pháp', 'phap', 'Wine', 4),
  ('Ý', 'y', 'Pizza', 5),
  ('Việt', 'viet', 'Soup', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed common locations
INSERT INTO public.locations (name, slug, sort_order) VALUES
  ('TP.HCM', 'tphcm', 1),
  ('Hà Nội', 'ha-noi', 2),
  ('Đà Nẵng', 'da-nang', 3)
ON CONFLICT (slug) DO NOTHING;
