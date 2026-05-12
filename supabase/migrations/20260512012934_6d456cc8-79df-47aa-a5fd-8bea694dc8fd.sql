
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant_owner', 'customer');
CREATE TYPE public.membership_status AS ENUM ('trial', 'active', 'expired', 'pending');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== RESTAURANTS =====
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cuisine_type TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  price_range TEXT DEFAULT '₫₫₫',
  rating NUMERIC(2,1) DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  -- editable landing page content as JSON (sections, hero text, gallery, story, hours, etc.)
  landing_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- membership
  membership_status public.membership_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  membership_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_city ON public.restaurants(city);

-- helper: is the restaurant active (trial not expired or paid)
CREATE OR REPLACE FUNCTION public.restaurant_is_active(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id
      AND (
        (membership_status = 'trial' AND trial_ends_at > now())
        OR (membership_status = 'active' AND (membership_ends_at IS NULL OR membership_ends_at > now()))
      )
  )
$$;

-- ===== MENU =====
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_signature BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);

-- ===== BOOKINGS =====
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  party_size INT NOT NULL,
  booking_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bookings_restaurant ON public.bookings(restaurant_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);

-- ===== ORDERS (in-restaurant only, not site-wide checkout) =====
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_restaurant ON public.orders(restaurant_id);

-- ===== DEALS =====
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  badge TEXT,
  tag TEXT,
  image_url TEXT,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_deals_restaurant ON public.deals(restaurant_id);

-- ===== FAVORITES =====
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (restaurant_id IS NOT NULL OR deal_id IS NOT NULL)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX uniq_fav_restaurant ON public.favorites(user_id, restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_fav_deal ON public.favorites(user_id, deal_id) WHERE deal_id IS NOT NULL;

-- ===== MEMBERSHIP PAYMENTS (manual QR + admin approve) =====
CREATE TABLE public.membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  proof_image_url TEXT,
  note TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;

-- ===== TRIGGERS =====

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- on signup: create profile + assign customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- when admin approves a payment: extend membership
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    UPDATE public.restaurants
    SET membership_status = 'active',
        membership_ends_at = GREATEST(COALESCE(membership_ends_at, now()), now()) + (NEW.duration_days || ' days')::INTERVAL
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_payment_approval
AFTER UPDATE ON public.membership_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approval();

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles admin read" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles admin all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- restaurants
CREATE POLICY "restaurants public read" ON public.restaurants FOR SELECT USING (is_published = true OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "restaurants owner insert" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "restaurants owner update" ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "restaurants owner delete" ON public.restaurants FOR DELETE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- menu categories
CREATE POLICY "menu_cat public read" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "menu_cat owner write" ON public.menu_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- menu items
CREATE POLICY "menu_items public read" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items owner write" ON public.menu_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- bookings: customer can create + read own; owner sees own restaurant
CREATE POLICY "bookings insert anyone" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings user read" ON public.bookings FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "bookings owner update" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- orders
CREATE POLICY "orders insert anyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders read" ON public.orders FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "orders owner update" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- deals
CREATE POLICY "deals public read" ON public.deals FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "deals owner write" ON public.deals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- favorites
CREATE POLICY "favorites self all" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- membership_payments
CREATE POLICY "payments owner read" ON public.membership_payments FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments owner insert" ON public.membership_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments admin update" ON public.membership_payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
