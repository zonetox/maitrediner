import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Crown, Check, Sparkles, Shield, Zap, Star, ArrowRight, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "Gói thành viên — Maison Dining" },
      { name: "description", content: "Các gói thành viên dành cho nhà hàng cao cấp tham gia hệ sinh thái Maison Dining." },
      { property: "og:title", content: "Gói thành viên Maison Dining" },
      { property: "og:description", content: "Hiện diện sang trọng, nhận đặt chỗ và phát triển thương hiệu nhà hàng." },
    ],
  }),
  component: MembershipPublic,
});

const ICONS = [Zap, Star, Crown];

const FAQS = [
  {
    q: "Tôi được dùng thử bao lâu?",
    a: "Mỗi nhà hàng đăng ký mới được kích hoạt ngay 30 ngày dùng thử miễn phí với toàn bộ tính năng. Sau đó trang sẽ làm mờ cho đến khi bạn nâng cấp gói.",
  },
  {
    q: "Hình thức thanh toán?",
    a: "Hiện tại Maison Dining hỗ trợ chuyển khoản qua mã QR ngân hàng. Đội ngũ admin sẽ xác minh và kích hoạt gói trong vòng 24 giờ.",
  },
  {
    q: "Có hợp đồng ràng buộc không?",
    a: "Không. Bạn có thể chọn gói theo tháng/quý/năm và ngừng gia hạn bất kỳ lúc nào.",
  },
  {
    q: "Maison Dining có nhận hoa hồng trên đơn đặt bàn không?",
    a: "Không. Mọi đặt chỗ và doanh thu thuộc về nhà hàng. Maison Dining chỉ thu phí gói thành viên.",
  },
];

function MembershipPublic() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("membership_plans").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setPlans(data ?? []));
  }, []);

  function ctaFor(slug?: string) {
    if (user) return { to: "/partner/membership" as const, search: slug ? { plan: slug } : {} };
    return { to: "/auth" as const, search: { mode: "register" as const, as: "restaurant" as const, ...(slug ? { plan: slug } : {}) } };
  }
  const heroCta = ctaFor();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-background to-background" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gold/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-gold">
              <Sparkles className="h-3 w-3" /> Membership
            </span>
            <h1 className="font-serif text-5xl md:text-7xl mt-6 leading-[1.05]">
              Hiện diện <span className="text-gradient-gold">sang trọng</span><br />trên Maison Dining
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
              Trang landing riêng, nhận đặt chỗ trực tiếp, không hoa hồng — chỉ thanh toán gói thành viên đơn giản.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              <Link to={heroCta.to} search={heroCta.search as any} className="px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition flex items-center gap-2">
                Bắt đầu 30 ngày miễn phí <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#plans" className="px-8 py-4 rounded-full border border-border hover:border-gold transition">
                Xem các gói
              </a>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> Không hoa hồng</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> Không hợp đồng</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" /> Hủy bất cứ lúc nào</span>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="py-24 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Bảng giá</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">Chọn gói phù hợp</h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                Mọi gói đều bao gồm trang landing đầy đủ, hệ thống đặt chỗ và quản lý menu.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p: any, idx: number) => {
                const Icon = ICONS[idx % ICONS.length];
                return (
                  <div key={p.id}
                    className={`relative rounded-2xl border p-8 transition ${
                      p.is_popular ? "border-gold bg-gold/5 shadow-gold md:scale-105" : "border-border bg-card hover:border-gold/40"
                    }`}>
                    {p.is_popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-4 py-1 rounded-full bg-gradient-gold text-primary-foreground font-medium tracking-wider uppercase">
                        Phổ biến nhất
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-gold" />
                      <h3 className="font-serif text-2xl">{p.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                    <div className="mt-6 mb-6 pb-6 border-b border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-5xl text-gold">{(Number(p.price) / 1000).toFixed(0)}K</span>
                        <span className="text-muted-foreground text-sm">/ {p.duration_days} ngày</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {Number(p.price).toLocaleString("vi-VN")}₫ · tiết kiệm khi mua dài hạn
                      </p>
                    </div>
                    <ul className="space-y-3 text-sm mb-8">
                      {(p.perks ?? []).map((perk: string) => (
                        <li key={perk} className="flex gap-3 text-muted-foreground">
                          <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    {(() => { const c = ctaFor(p.slug); return (
                    <Link to={c.to} search={c.search as any}
                      className={`block text-center w-full px-6 py-3 rounded-full font-medium transition ${
                        p.is_popular
                          ? "bg-gradient-gold text-primary-foreground hover:shadow-gold"
                          : "border border-border hover:border-gold"
                      }`}>
                      {user ? "Nâng cấp ngay" : "Bắt đầu dùng thử"}
                    </Link>); })()}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-16">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Quy trình</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">3 bước để bắt đầu</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: "01", t: "Đăng ký tài khoản", d: "Tạo tài khoản nhà hàng và thiết lập trang landing trong vài phút." },
                { n: "02", t: "Tùy chỉnh nội dung", d: "Thêm menu, hình ảnh, câu chuyện thương hiệu và ưu đãi của bạn." },
                { n: "03", t: "Chọn gói & thanh toán", d: "Quét QR chuyển khoản. Admin duyệt trong 24 giờ và kích hoạt gói." },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="font-serif text-6xl text-gradient-gold mb-4">{s.n}</div>
                  <h3 className="font-serif text-2xl mb-3">{s.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Benefits */}
        <section className="py-24 border-t border-border">
          <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-8">
            {[
              { i: Shield, t: "Cam kết minh bạch", d: "Không hoa hồng ẩn, không phí khởi tạo. Chỉ một khoản phí thành viên duy nhất." },
              { i: QrCode, t: "Thanh toán đơn giản", d: "Chuyển khoản qua mã QR ngân hàng VietQR. Kích hoạt nhanh trong 24 giờ." },
              { i: Crown, t: "Định vị cao cấp", d: "Maison Dining chỉ tuyển chọn các nhà hàng fine dining, omakase, bistro chất lượng." },
            ].map((b) => (
              <div key={b.t} className="p-8 rounded-2xl border border-border bg-card">
                <b.i className="h-7 w-7 text-gold mb-5" />
                <h3 className="font-serif text-2xl mb-3">{b.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-12">
              <span className="text-xs tracking-[0.3em] uppercase text-gold">Câu hỏi thường gặp</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">Bạn cần biết</h2>
            </div>
            <div className="space-y-4">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-border bg-card p-6 open:border-gold transition">
                  <summary className="font-serif text-xl cursor-pointer flex justify-between items-center list-none">
                    {f.q}
                    <span className="text-gold text-2xl group-open:rotate-45 transition">+</span>
                  </summary>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-gold/5 to-background" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <Crown className="h-10 w-10 text-gold mx-auto mb-6" />
            <h2 className="font-serif text-4xl md:text-6xl leading-tight">
              Sẵn sàng đưa nhà hàng<br />của bạn lên <span className="text-gradient-gold">Maison Dining?</span>
            </h2>
            <p className="text-muted-foreground mt-6 text-lg">
              Bắt đầu 30 ngày miễn phí. Không cần thẻ tín dụng.
            </p>
            <Link to={heroCta.to} search={heroCta.search as any} className="inline-flex items-center gap-2 mt-10 px-10 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition">
              Đăng ký nhà hàng <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
