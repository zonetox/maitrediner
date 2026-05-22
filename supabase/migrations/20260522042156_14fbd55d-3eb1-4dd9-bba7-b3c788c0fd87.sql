
CREATE TABLE public.membership_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price NUMERIC NOT NULL DEFAULT 0,
  perks TEXT[] NOT NULL DEFAULT '{}',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans public read" ON public.membership_plans
  FOR SELECT USING (true);

CREATE POLICY "plans admin write" ON public.membership_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER plans_set_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.membership_plans (name, slug, tagline, duration_days, price, perks, is_popular, sort_order) VALUES
('Essential', 'monthly', 'Khởi đầu chuyên nghiệp', 30, 499000,
  ARRAY['Trang landing page riêng đầy đủ','Nhận đặt chỗ không giới hạn','Quản lý menu & ưu đãi','Hiển thị trong danh bạ Maître','Hỗ trợ qua email'],
  false, 1),
('Signature', 'quarterly', 'Lựa chọn được ưa chuộng', 90, 1290000,
  ARRAY['Mọi tính năng của Essential','Ưu tiên hiển thị trong danh sách','Huy hiệu Signature trên trang','Báo cáo hiệu quả hàng tuần','Hỗ trợ ưu tiên 12h'],
  true, 2),
('Maître', 'yearly', 'Đặc quyền cao cấp', 365, 4490000,
  ARRAY['Mọi tính năng của Signature','Hiển thị nổi bật trang chủ','Phân tích chuyên sâu khách hàng','Account manager riêng','Chiến dịch ưu đãi theo mùa','Tư vấn thương hiệu 1-1'],
  false, 3);
