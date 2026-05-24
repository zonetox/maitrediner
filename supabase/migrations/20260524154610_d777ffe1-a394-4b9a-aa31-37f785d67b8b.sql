CREATE TABLE IF NOT EXISTS public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  brand_name text NOT NULL DEFAULT 'Maison Dining',
  brand_tagline text NOT NULL DEFAULT 'Danh bạ nhà hàng cao cấp tuyển chọn. Khám phá, đặt bàn và tận hưởng những trải nghiệm đáng nhớ.',
  contact_email text NOT NULL DEFAULT 'hello@maisondining.com',
  header_nav jsonb NOT NULL DEFAULT '[
    {"label":"Nhà hàng","to":"/restaurants"},
    {"label":"Signature","to":"/signature"},
    {"label":"Ưu đãi","to":"/deals"},
    {"label":"Gói thành viên","to":"/membership"}
  ]'::jsonb,
  footer_columns jsonb NOT NULL DEFAULT '[
    {"title":"Khám phá","links":[
      {"label":"Nhà hàng","to":"/restaurants"},
      {"label":"Ưu đãi","to":"/deals"},
      {"label":"Yêu thích","to":"/account"}
    ]},
    {"title":"Đối tác","links":[
      {"label":"Đăng ký nhà hàng","to":"/auth?mode=register&as=restaurant"},
      {"label":"Gói thành viên","to":"/membership"},
      {"label":"Quản trị","to":"/partner"}
    ]}
  ]'::jsonb,
  socials jsonb NOT NULL DEFAULT '{
    "instagram":"",
    "facebook":"",
    "youtube":"",
    "tiktok":""
  }'::jsonb,
  copyright text NOT NULL DEFAULT '© {year} Maison Dining. Tuyển chọn từ Việt Nam.',
  bottom_links jsonb NOT NULL DEFAULT '[
    {"label":"Điều khoản","to":"/terms"},
    {"label":"Bảo mật","to":"/privacy"}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings public read"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings admin all"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (id) VALUES (true)
  ON CONFLICT (id) DO NOTHING;