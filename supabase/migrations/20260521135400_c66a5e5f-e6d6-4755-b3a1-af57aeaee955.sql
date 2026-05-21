-- App settings (admin-only): integration keys
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true,
  resend_api_key text,
  resend_from text DEFAULT 'Maître <onboarding@resend.dev>',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = true)
);
INSERT INTO public.app_settings (id) VALUES (true);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings admin all" ON public.app_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Payment settings (public read, admin write): QR + bank info
CREATE TABLE public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true,
  qr_image_url text,
  bank_name text,
  account_no text,
  account_holder text,
  instructions text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton_pay CHECK (id = true)
);
INSERT INTO public.payment_settings (id) VALUES (true);
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_settings public read" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "payment_settings admin write" ON public.payment_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for bookings & orders so partner dashboard updates live
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;