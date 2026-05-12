import { UtensilsCrossed, Instagram, Facebook, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="h-5 w-5 text-gold" />
              <span className="font-serif text-xl">Maître<span className="text-gold">.</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Danh bạ nhà hàng cao cấp tuyển chọn. Khám phá, đặt bàn và tận hưởng những trải nghiệm đáng nhớ.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4 text-gold">Khám phá</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Nhà hàng nổi bật</li>
              <li>Bộ sưu tập</li>
              <li>Ưu đãi</li>
              <li>Sự kiện</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4 text-gold">Đối tác</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Đăng ký nhà hàng</li>
              <li>Gói thành viên</li>
              <li>Trung tâm hỗ trợ</li>
              <li>Liên hệ</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4 text-gold">Theo dõi</h4>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <button key={i} className="h-10 w-10 rounded-full border border-border grid place-items-center hover:border-gold hover:text-gold transition">
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hairline mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Maître. Tuyển chọn từ Việt Nam.</p>
          <div className="flex gap-6">
            <span>Điều khoản</span>
            <span>Bảo mật</span>
            <span>Cookie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
